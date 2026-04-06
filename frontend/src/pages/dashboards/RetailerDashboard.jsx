import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PanelLayout from '../../components/layouts/PanelLayout';
import { APP_DOMAIN } from '../../constants/branding';
import { customerProductsApi } from '../../services/customerProductsApi';
import { inventoryProductsApi } from '../../services/inventoryProductsApi';
import { retailerProductsApi } from '../../services/retailerProductsApi';
import { retailerCustomersApi } from '../../services/retailerCustomersApi';
import { restockRequestsApi } from '../../services/restockRequestsApi';
import { serviceRequestsApi } from '../../services/serviceRequestsApi';

const sections = [
  {
    heading: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    heading: 'Management',
    items: [
      { id: 'inventory', label: 'Inventory', icon: 'box' },
      { id: 'orders', label: 'Orders', icon: 'cart' },
      { id: 'customers', label: 'Customers', icon: 'users' },
      { id: 'service-requests', label: 'Service Requests', icon: 'ticket' },
    ],
  },
  {
    heading: 'Insights',
    items: [{ id: 'sales', label: 'Sales', icon: 'chart' }],
  },
  {
    heading: 'Support',
    items: [{ id: 'settings', label: 'Settings', icon: 'gear' }],
  },
  {
    heading: 'System',
    items: [{ id: 'logout', label: 'Logout', icon: 'logout', action: 'logout' }],
  },
];

const chartAxis = { fill: '#6b7280', fontSize: 12 };
const chartTooltip = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  fontSize: '12px',
};

const cardClass = 'panel-hover-card rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
const panelClass = 'panel-hover-surface overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm';
const headClass = 'px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500';
const cellClass = 'px-5 py-4 text-sm text-gray-600';
const initialCustomerSummary = {
  activeCustomers: '0',
  premiumMembers: '0',
  newThisMonth: '0',
  repeatRate: '0%',
};
const initialRetailerCatalogForm = {
  name: '',
  category: '',
  price: '',
  sku: '',
  status: 'In Stock',
};
const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200';
const selectClass = `${inputClass} bg-white`;

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [distributorCatalog, setDistributorCatalog] = useState([]);
  const [retailerCatalog, setRetailerCatalog] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerSummary, setCustomerSummary] = useState(initialCustomerSummary);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');
  const [restockSubmittingId, setRestockSubmittingId] = useState('');
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockRequestsLoading, setRestockRequestsLoading] = useState(false);
  const [restockRequestsError, setRestockRequestsError] = useState('');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [serviceRequestsError, setServiceRequestsError] = useState('');
  const [catalogSavingId, setCatalogSavingId] = useState('');
  const [showCatalogComposer, setShowCatalogComposer] = useState(false);
  const [catalogForm, setCatalogForm] = useState(initialRetailerCatalogForm);
  const [catalogFormSaving, setCatalogFormSaving] = useState(false);

  const loginData = JSON.parse(localStorage.getItem('loginData') || '{}');
  const userName = loginData?.userName || 'Retailer User';
  const retailerEmail = loginData?.email || `retailer@${APP_DOMAIN}`;
  const retailerName = String(userName || 'Retailer User').replace(/_/g, ' ');

  const query = searchQuery.trim().toLowerCase();

  const matchesSearch = (values) =>
    !query || values.some((value) => String(value).toLowerCase().includes(query));

  const filteredOrders = useMemo(() => [], [query]);

  const filteredInventory = useMemo(
    () =>
      products.filter((item) =>
        matchesSearch([
          item.productName,
          item.modelNumber,
          item.customerName,
          item.customerEmail,
          item.purchaseDate,
          item.status,
        ])
      ),
    [products, query]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((item) =>
        matchesSearch([item.name, item.email, item.tier])
      ),
    [customers, query]
  );

  const filteredRestockRequests = useMemo(
    () =>
      restockRequests.filter((item) =>
        matchesSearch([
          item.productName,
          item.brand,
          item.modelNumber,
          item.requestNote,
          item.status,
        ])
      ),
    [restockRequests, query]
  );

  const filteredServiceRequests = useMemo(
    () =>
      serviceRequests.filter((item) =>
        matchesSearch([
          item.productName,
          item.issueType,
          item.customerName,
          item.customerEmail,
          item.status,
        ])
      ),
    [serviceRequests, query]
  );

  const filteredDistributorCatalog = useMemo(
    () =>
      distributorCatalog.filter((item) =>
        matchesSearch([item.name, item.category, item.priceLabel, item.sku, item.status])
      ),
    [distributorCatalog, query]
  );

  const filteredRetailerCatalog = useMemo(
    () =>
      retailerCatalog.filter((item) =>
        matchesSearch([item.name, item.category, item.priceLabel, item.sku, item.status])
      ),
    [retailerCatalog, query]
  );

  const dashboardStats = useMemo(
    () => [
      { title: 'Customer Catalog', value: String(retailerCatalog.length), meta: 'Products published by retailer' },
      { title: 'Registrations', value: String(products.length), meta: 'Products registered by customers' },
      { title: 'Customers', value: String(customers.length), meta: 'Retail customer records' },
      { title: 'Service Requests', value: String(serviceRequests.length), meta: 'Requests raised by customers' },
    ],
    [retailerCatalog.length, products.length, customers.length, serviceRequests.length]
  );

  const activityData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
    const months = [];
    const monthIndex = new Map();
    const today = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthIndex.set(key, months.length);
      months.push({ name: formatter.format(date), count: 0 });
    }

    products.forEach((item) => {
      const sourceDate = item.createdAt || item.purchaseDate;
      if (!sourceDate) {
        return;
      }

      const parsed = new Date(String(sourceDate).includes('T') ? sourceDate : `${sourceDate}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      const targetIndex = monthIndex.get(key);
      if (targetIndex === undefined) {
        return;
      }

      months[targetIndex].count += 1;
    });

    return months;
  }, [products]);

  const activityTotal = useMemo(
    () => activityData.reduce((sum, item) => sum + item.count, 0),
    [activityData]
  );

  const salesStats = useMemo(
    () => [
      { title: 'Published Products', value: String(retailerCatalog.length), meta: 'Currently visible to customers' },
      { title: 'Registered Products', value: String(products.length), meta: 'Captured from customer activity' },
      { title: 'Restock Requests', value: String(restockRequests.length), meta: 'Raised to distributors' },
      { title: 'Recent Activity', value: String(activityTotal), meta: 'Entries across the last 6 months' },
    ],
    [retailerCatalog.length, products.length, restockRequests.length, activityTotal]
  );

  const orderStats = useMemo(
    () => [
      { title: 'Incoming Orders', value: '0', meta: 'No live order records yet' },
      { title: 'Delivered', value: '0', meta: 'Will update from real orders only' },
      { title: 'Returns', value: '0', meta: 'Only actual return records appear' },
      { title: 'Pending Payments', value: '0', meta: 'Only backend-driven records appear' },
    ],
    []
  );

  const storeInfo = useMemo(
    () => [
      { label: 'Store Name', value: retailerName || 'Retailer' },
      { label: 'Email', value: retailerEmail || `retailer@${APP_DOMAIN}` },
      { label: 'Customer Catalog', value: String(retailerCatalog.length) },
      { label: 'Registered Products', value: String(products.length) },
    ],
    [retailerName, retailerEmail, retailerCatalog.length, products.length]
  );

  const customerStats = useMemo(
    () => [
      { title: 'Active Customers', value: customerSummary.activeCustomers, meta: 'Live customer accounts' },
      { title: 'Premium Members', value: customerSummary.premiumMembers, meta: 'Frequent returning users' },
      { title: 'New This Month', value: customerSummary.newThisMonth, meta: 'Fresh customer signups' },
      { title: 'Repeat Rate', value: customerSummary.repeatRate, meta: 'Based on repeat logins' },
    ],
    [customerSummary]
  );

  useEffect(() => {
    if (!['inventory', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadInventory = async () => {
      setInventoryLoading(true);
      setInventoryError('');

      try {
        const response = await customerProductsApi.list();

        if (isCancelled) {
          return;
        }

        setProducts(response.registeredProducts || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setProducts([]);
        setInventoryError(error.message || 'Unable to load registered products.');
      } finally {
        if (!isCancelled) {
          setInventoryLoading(false);
        }
      }
    };

    loadInventory();
    const refreshTimer = window.setInterval(loadInventory, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);

  useEffect(() => {
    if (!['inventory', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadCatalogs = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const [distributorResponse, retailerResponse] = await Promise.all([
          inventoryProductsApi.list(),
          retailerProductsApi.list(),
        ]);

        if (isCancelled) {
          return;
        }

        setDistributorCatalog(distributorResponse.inventoryProducts || []);
        setRetailerCatalog(retailerResponse.retailerProducts || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setDistributorCatalog([]);
        setRetailerCatalog([]);
        setCatalogError(error.message || 'Unable to load catalog products.');
      } finally {
        if (!isCancelled) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalogs();
    const refreshTimer = window.setInterval(loadCatalogs, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);

  const recentRegisteredProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return sorted.slice(0, 5);
  }, [products]);

  useEffect(() => {
    if (!['customers', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError('');

      try {
        const response = await retailerCustomersApi.list();

        if (isCancelled) {
          return;
        }

        setCustomers(response.customers || []);
        setCustomerSummary(response.stats || initialCustomerSummary);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setCustomers([]);
        setCustomerSummary(initialCustomerSummary);
        setCustomersError(error.message || 'Unable to load customers.');
      } finally {
        if (!isCancelled) {
          setCustomersLoading(false);
        }
      }
    };

    loadCustomers();
    const refreshTimer = window.setInterval(loadCustomers, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);

  useEffect(() => {
    if (!['inventory', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadRestockRequests = async () => {
      setRestockRequestsLoading(true);
      setRestockRequestsError('');

      try {
        const response = await restockRequestsApi.list(retailerEmail.toLowerCase());

        if (isCancelled) {
          return;
        }

        setRestockRequests(response.restockRequests || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setRestockRequests([]);
        setRestockRequestsError(error.message || 'Unable to load restock requests.');
      } finally {
        if (!isCancelled) {
          setRestockRequestsLoading(false);
        }
      }
    };

    loadRestockRequests();
    const refreshTimer = window.setInterval(loadRestockRequests, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection, retailerEmail]);

  useEffect(() => {
    if (!['service-requests', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadRequests = async () => {
      setServiceRequestsLoading(true);
      setServiceRequestsError('');

      try {
        const response = await serviceRequestsApi.list();

        if (isCancelled) {
          return;
        }

        setServiceRequests(response.serviceRequests || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setServiceRequests([]);
        setServiceRequestsError(error.message || 'Unable to load service requests.');
      } finally {
        if (!isCancelled) {
          setServiceRequestsLoading(false);
        }
      }
    };

    loadRequests();
    const refreshTimer = window.setInterval(loadRequests, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);


  const inventoryStats = useMemo(() => {
    const activeWarrantyCount = products.filter((item) => item.status === 'Active').length;
    const expiringSoonCount = products.filter((item) => item.status === 'Expiring Soon').length;
    const uniqueModels = new Set(products.map((item) => item.modelNumber)).size;

    return [
      { title: 'Registered Products', value: String(products.length), meta: 'Saved from customer registrations' },
      { title: 'Unique Models', value: String(uniqueModels), meta: 'Different products tracked' },
      { title: 'Active Warranty', value: String(activeWarrantyCount), meta: 'Currently covered products' },
      { title: 'Expiring Soon', value: String(expiringSoonCount), meta: 'Need follow-up soon' },
    ];
  }, [products]);

  const retailerCatalogMap = useMemo(() => {
    const map = new Set();
    retailerCatalog.forEach((item) => {
      if (item.sku) {
        map.add(String(item.sku).toLowerCase());
      }
      if (item.name) {
        map.add(String(item.name).toLowerCase());
      }
    });
    return map;
  }, [retailerCatalog]);

  const closeCatalogComposer = () => {
    setShowCatalogComposer(false);
    setCatalogForm(initialRetailerCatalogForm);
  };

  const handleCatalogFormSubmit = async (event) => {
    event.preventDefault();

    const name = catalogForm.name.trim();
    const category = catalogForm.category.trim();
    const price = Number(catalogForm.price);
    const sku = String(catalogForm.sku || '').trim().toUpperCase();

    if (!name || !category) {
      toast.error('Please add a product name and category.');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid price.');
      return;
    }

    if (
      sku &&
      retailerCatalog.some((item) => String(item.sku || '').trim().toLowerCase() === sku.toLowerCase())
    ) {
      toast.error('A product with this SKU already exists in customer inventory.');
      return;
    }

    setCatalogFormSaving(true);

    try {
      const response = await retailerProductsApi.create({
        name,
        category,
        price,
        sku,
        status: catalogForm.status || 'In Stock',
      });

      setRetailerCatalog((current) => [response.retailerProduct, ...current]);
      toast.success('Inventory added. Customers can now see this product.');
      closeCatalogComposer();
    } catch (error) {
      toast.error(error.message || 'Unable to add inventory.');
    } finally {
      setCatalogFormSaving(false);
    }
  };

  const handleAddToCustomerCatalog = async (product) => {
    if (!product) {
      return;
    }

    const skuKey = String(product.sku || '').toLowerCase();
    const nameKey = String(product.name || product.product || '').toLowerCase();
    if (retailerCatalogMap.has(skuKey) || retailerCatalogMap.has(nameKey)) {
      toast('Already added to customer catalog.');
      return;
    }

    setCatalogSavingId(product.id);

    try {
      const response = await retailerProductsApi.create({
        name: product.name || product.product,
        category: product.category || 'Kitchen',
        price: product.price || 0,
        sku: product.sku || '',
        status: product.status || 'Active',
      });

      setRetailerCatalog((current) => [response.retailerProduct, ...current]);
      toast.success('Added to customer catalog.');
    } catch (error) {
      toast.error(error.message || 'Unable to add product.');
    } finally {
      setCatalogSavingId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loginData');
    localStorage.removeItem('role');
    navigate('/retailer/login');
  };

  const handleRestockRequest = async (product) => {
    if (!product) {
      return;
    }

    setRestockSubmittingId(product.id);

    try {
      await restockRequestsApi.create({
        retailerName,
        retailerEmail,
        productName: product.productName,
        brand: product.brand || '',
        modelNumber: product.modelNumber || '',
        customerName: product.customerName || '',
        customerEmail: product.customerEmail || '',
        requestNote: product.customerName
          ? `Restock requested for ${product.productName} (registered by ${product.customerName}).`
          : `Restock requested for ${product.productName}.`,
        requestedQuantity: 1,
      });

      toast.success('Restock request sent to distributor.');
    } catch (error) {
      toast.error(error.message || 'Unable to create restock request.');
    } finally {
      setRestockSubmittingId('');
    }
  };

  const getTitle = () =>
    sections
      .flatMap((section) => section.items)
      .find((item) => item.id === activeSection)?.label || 'Dashboard';

  const badgeClass = (status) => {
    if (['Delivered', 'Premium', 'Active', 'Accepted', 'In Stock'].includes(status)) {
      return 'inline-flex rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white';
    }

    if (['Pending', 'Processing', 'Standard', 'Expiring Soon', 'Low Stock'].includes(status)) {
      return 'inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700';
    }

    if (['Expired', 'Rejected', 'Out of Stock'].includes(status)) {
      return 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700';
    }

    return 'inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600';
  };

  const formatPurchaseDate = (value) => {
    const parsed = new Date(String(value).includes('T') ? value : `${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return value || 'Not available';
    }

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatWarranty = (value) => {
    if (!value) {
      return 'Not available';
    }

    return `${value} months`;
  };

  const formatRequestDate = (value) => {
    if (!value) {
      return 'Not available';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return 'Not available';
    }

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const latestRestockMap = useMemo(() => {
    const map = new Map();
    restockRequests.forEach((item) => {
      const key = `${item.productName || ''}::${item.modelNumber || ''}`;
      const current = map.get(key);
      if (!current || new Date(item.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        map.set(key, item);
      }
    });
    return map;
  }, [restockRequests]);


  const renderCards = (items) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className={cardClass}>
          <p className="text-sm text-gray-500">{item.title}</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">{item.value}</h2>
          <p className="mt-2 text-xs text-gray-400">{item.meta}</p>
        </div>
      ))}
    </div>
  );

  const renderTable = (title, columns, rows, keyField, emptyMessage = 'No records found.') => (
    <div className={panelClass}>
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={headClass}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row[keyField]} className="panel-hover-row border-b border-gray-200 last:border-b-0">
                  {columns.map((column) => (
                    <td key={column.key} className={`${cellClass} ${column.bold ? 'font-medium text-gray-900' : ''}`}>
                      {column.badge ? (
                        <span className={badgeClass(row[column.key])}>{row[column.key]}</span>
                      ) : column.render ? (
                        column.render(row)
                      ) : (
                        row[column.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChart = (title) => (
    <div className={panelClass}>
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} barCategoryGap="28%" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth={0.5} vertical={false} />
              <XAxis dataKey="name" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} width={42} />
              <Tooltip contentStyle={chartTooltip} formatter={(value) => value.toLocaleString()} />
              <Bar dataKey="count" fill="#6B7280" barSize={18} radius={[6, 6, 0, 0]} activeBar={{ fill: '#4B5563' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const dashboardView = (
    <div className="space-y-6">
      {renderCards(dashboardStats)}
      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        {renderChart('Registration Trend')}
        <div className={panelClass}>
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Store Info</h3>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
            {storeInfo.map((item) => (
              <div key={item.label} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {inventoryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {inventoryError}
        </div>
      ) : null}
      {renderTable(
        'Recent Product Registrations',
        [
          { key: 'productName', label: 'Product', bold: true },
          { key: 'brand', label: 'Brand' },
          { key: 'modelNumber', label: 'Model' },
          { key: 'customerName', label: 'Customer' },
          { key: 'customerEmail', label: 'Email' },
          { key: 'purchaseDate', label: 'Purchased', render: (row) => formatPurchaseDate(row.purchaseDate) },
          { key: 'warrantyMonths', label: 'Warranty', render: (row) => formatWarranty(row.warrantyMonths) },
          { key: 'invoiceName', label: 'Invoice', render: (row) => row.invoiceName || 'Not uploaded' },
          { key: 'status', label: 'Status', badge: true },
        ],
        recentRegisteredProducts,
        'id',
        inventoryLoading ? 'Loading recent registrations...' : 'No recent product registrations yet.'
      )}
      {customersError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {customersError}
        </div>
      ) : null}
    </div>
  );

  const sectionView = {
    inventory: (
      <div className="space-y-6">
        {renderCards(inventoryStats)}
        <div className={panelClass}>
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Add Inventory</h3>
              <p className="mt-1 text-xs text-gray-500">
                Products added here appear in the customer products page and register product flow.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {retailerCatalog.length} products live for customers
              </span>
              <button
                type="button"
                onClick={() => (showCatalogComposer ? closeCatalogComposer() : setShowCatalogComposer(true))}
                className="panel-hover-button-dark rounded-lg bg-black px-4 py-2 text-sm text-white transition"
              >
                {showCatalogComposer ? 'Close Form' : 'Add Inventory'}
              </button>
            </div>
          </div>
          {showCatalogComposer ? (
            <form onSubmit={handleCatalogFormSubmit} className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Product Name</span>
                <input
                  type="text"
                  value={catalogForm.name}
                  onChange={(event) => setCatalogForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Mixer Grinder"
                  className={inputClass}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Category</span>
                <input
                  type="text"
                  value={catalogForm.category}
                  onChange={(event) => setCatalogForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Kitchen"
                  className={inputClass}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Price</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={catalogForm.price}
                  onChange={(event) => setCatalogForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="2499"
                  className={inputClass}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</span>
                <select
                  value={catalogForm.status}
                  onChange={(event) => setCatalogForm((current) => ({ ...current, status: event.target.value }))}
                  className={selectClass}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Active">Active</option>
                </select>
              </label>
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">SKU</span>
                <input
                  type="text"
                  value={catalogForm.sku}
                  onChange={(event) => setCatalogForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))}
                  placeholder="RET-MG-1001"
                  className={inputClass}
                />
              </label>
              <div className="flex flex-wrap items-end justify-end gap-3 xl:col-span-5">
                <button
                  type="button"
                  onClick={closeCatalogComposer}
                  className="panel-hover-button-light rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catalogFormSaving}
                  className="panel-hover-button-dark rounded-lg bg-black px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {catalogFormSaving ? 'Adding...' : 'Save Inventory'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-500">Customer catalog</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{retailerCatalog.length}</p>
                <p className="mt-1 text-xs text-gray-400">Live products visible to customers</p>
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-500">Distributor source</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{distributorCatalog.length}</p>
                <p className="mt-1 text-xs text-gray-400">Products available to import quickly</p>
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-500">Publishing flow</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Retailer adds, customer sees</p>
                <p className="mt-1 text-xs text-gray-400">New inventory appears on the customer products page</p>
              </div>
            </div>
          )}
        </div>
        {catalogError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {catalogError}
          </div>
        ) : null}
        {renderTable(
          'Distributor Products',
          [
            { key: 'name', label: 'Product', bold: true },
            { key: 'category', label: 'Category' },
            { key: 'priceLabel', label: 'Price' },
            { key: 'sku', label: 'SKU' },
            { key: 'status', label: 'Status', badge: true },
            {
              key: 'actions',
              label: 'Customer Catalog',
              render: (row) => {
                const skuKey = String(row.sku || '').toLowerCase();
                const nameKey = String(row.name || '').toLowerCase();
                const alreadyAdded = retailerCatalogMap.has(skuKey) || retailerCatalogMap.has(nameKey);
                if (alreadyAdded) {
                  return <span className={badgeClass('Active')}>Added</span>;
                }
                return (
                  <button
                    type="button"
                    onClick={() => handleAddToCustomerCatalog(row)}
                    disabled={catalogSavingId === row.id}
                    className="panel-hover-button-dark rounded-lg bg-black px-3 py-1.5 text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {catalogSavingId === row.id ? 'Adding...' : 'Add'}
                  </button>
                );
              },
            },
          ],
          filteredDistributorCatalog,
          'id',
          catalogLoading ? 'Loading distributor catalog...' : 'No distributor products yet.'
        )}
        {renderTable(
          'Customer Catalog',
          [
            { key: 'name', label: 'Product', bold: true },
            { key: 'category', label: 'Category' },
            { key: 'priceLabel', label: 'Price' },
            { key: 'sku', label: 'SKU' },
            { key: 'status', label: 'Status', badge: true },
          ],
          filteredRetailerCatalog,
          'id',
          catalogLoading ? 'Loading customer catalog...' : 'No customer catalog products yet.'
        )}
        {inventoryError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {inventoryError}
          </div>
        ) : null}
        {renderTable(
          'Customer Registered Products',
          [
            { key: 'productName', label: 'Product', bold: true },
            { key: 'modelNumber', label: 'Model' },
            { key: 'customerName', label: 'Customer' },
            { key: 'purchaseDate', label: 'Purchased On', render: (row) => formatPurchaseDate(row.purchaseDate) },
            { key: 'status', label: 'Status', badge: true },
            {
              key: 'actions',
              label: 'Restock',
              render: (row) => {
                const key = `${row.productName || ''}::${row.modelNumber || ''}`;
                const existing = latestRestockMap.get(key);
                if (existing?.status === 'Accepted') {
                  return <span className={badgeClass('Accepted')}>Accepted</span>;
                }
                if (existing?.status === 'Pending') {
                  return <span className={badgeClass('Pending')}>Requested</span>;
                }
                return (
                  <button
                    type="button"
                    onClick={() => handleRestockRequest(row)}
                    disabled={restockSubmittingId === row.id}
                    className={`panel-hover-button-dark rounded-lg bg-black px-3 py-1.5 text-xs text-white transition ${
                      restockSubmittingId === row.id ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    {restockSubmittingId === row.id ? 'Sending...' : 'Request'}
                  </button>
                );
              },
            },
          ],
          filteredInventory,
          'id',
          inventoryLoading ? 'Loading registered products...' : 'No customer registered products yet.'
        )}
        {restockRequestsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {restockRequestsError}
          </div>
        ) : null}
        {renderTable(
          'My Restock Requests',
          [
            { key: 'productName', label: 'Product', bold: true },
            { key: 'brand', label: 'Brand' },
            { key: 'modelNumber', label: 'Model' },
            { key: 'requestNote', label: 'Requirement', render: (row) => row.requestNote || 'Restock requested' },
            { key: 'requestedQuantity', label: 'Qty' },
            { key: 'createdAt', label: 'Requested On', render: (row) => formatRequestDate(row.createdAt) },
            { key: 'status', label: 'Status', badge: true },
          ],
          restockRequestsLoading ? [] : filteredRestockRequests,
          'id',
          restockRequestsLoading ? 'Loading restock requests...' : 'No restock requests yet.'
        )}
      </div>
    ),
    orders: (
      <div className="space-y-6">
        {renderCards(orderStats)}
        {renderTable(
          'Order Activity',
          [
            { key: 'product', label: 'Product', bold: true },
            { key: 'customer', label: 'Customer' },
            { key: 'price', label: 'Price' },
            { key: 'status', label: 'Status', badge: true },
          ],
          filteredOrders,
          'id',
          'No order records yet.'
        )}
      </div>
    ),
    customers: (
      <div className="space-y-6">
        {renderCards(customerStats)}
        {customersError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {customersError}
          </div>
        ) : null}
        {renderTable(
          'Customer Directory',
          [
            { key: 'name', label: 'Customer', bold: true },
            { key: 'email', label: 'Email' },
            { key: 'orders', label: 'Orders' },
            { key: 'tier', label: 'Tier', badge: true },
          ],
          filteredCustomers,
          'email',
          customersLoading ? 'Loading customers...' : 'No customer records yet.'
        )}
      </div>
    ),
    'service-requests': (
      <div className="space-y-6">
        {serviceRequestsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serviceRequestsError}
          </div>
        ) : null}
        {renderTable(
          'Service Requests',
          [
            { key: 'productName', label: 'Product', bold: true },
            { key: 'issueType', label: 'Issue' },
            { key: 'customerName', label: 'Customer' },
            { key: 'customerEmail', label: 'Email' },
            { key: 'description', label: 'Requirement', render: (row) => row.description || 'Not provided' },
            { key: 'createdAt', label: 'Requested', render: (row) => formatRequestDate(row.createdAt) },
            { key: 'status', label: 'Status', badge: true },
          ],
          filteredServiceRequests,
          'id',
          serviceRequestsLoading ? 'Loading service requests...' : 'No service requests yet.'
        )}
      </div>
    ),
    sales: (
      <div className="space-y-6">
        {renderCards(salesStats)}
        {renderChart('Retail Activity')}
      </div>
    ),
    settings: (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Store Profile</h3>
          </div>
          <div className="space-y-4 p-5">
            {storeInfo.slice(0, 3).map((item) => (
              <div key={item.label}>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={panelClass}>
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Preferences</h3>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Order Notifications</p>
              <p className="mt-1 text-xs text-gray-500">Receive updates for new orders and changes.</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Inventory Alerts</p>
              <p className="mt-1 text-xs text-gray-500">Monitor low stock and restock reminders.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="panel-hover-button-light rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition">
                Cancel
              </button>
              <button type="button" className="panel-hover-button-dark rounded-lg bg-black px-4 py-2 text-sm text-white transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const handleMenuSelect = (item) => {
    if (item.action === 'logout') {
      handleLogout();
      return;
    }

    setActiveSection(item.id);
  };

  return (
    <>
      <PanelLayout
        panelLabel="Retailer Panel"
        title={getTitle()}
        subtitle="Compact commerce workspace with a sticky top bar and collapsible navigation."
        menuSections={sections}
        activeItem={activeSection}
        onSelectItem={handleMenuSelect}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        userName={userName}
        userEmail={retailerEmail}
        userInitial="R"
        profileActions={[
          { label: 'Store Profile', onClick: () => {} },
          { label: 'Notifications', onClick: () => {} },
        ]}
        onLogout={handleLogout}
      >
        <div className="min-h-full">
          {activeSection === 'dashboard' ? dashboardView : sectionView[activeSection] || dashboardView}
        </div>
      </PanelLayout>
    </>
  );
};

export default RetailerDashboard;
