import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Retailers from '../distributor/Retailers';
import PanelLayout from '../../components/layouts/PanelLayout';
import { APP_DOMAIN, APP_NAME } from '../../constants/branding';
import { customerProductsApi } from '../../services/customerProductsApi';
import { distributorsApi } from '../../services/distributorsApi';
import { inventoryProductsApi } from '../../services/inventoryProductsApi';
import { restockRequestsApi } from '../../services/restockRequestsApi';
import { serviceRequestsApi } from '../../services/serviceRequestsApi';

const sections = [
  { heading: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/distributor/dashboard' }] },
  {
    heading: 'Management',
    items: [
      { id: 'inventory', label: 'Inventory', icon: 'box', path: '/distributor/dashboard' },
      { id: 'orders', label: 'Orders', icon: 'cart', path: '/distributor/dashboard' },
      { id: 'restock', label: 'Restock Requests', icon: 'refresh', path: '/distributor/dashboard' },
      { id: 'retailers', label: 'Retailers', icon: 'store', path: '/distributor/retailers' },
    ],
  },
  { heading: 'Insights', items: [{ id: 'performance', label: 'Performance', icon: 'chart', path: '/distributor/dashboard' }] },
  { heading: 'Support', items: [{ id: 'settings', label: 'Settings', icon: 'gear', path: '/distributor/dashboard' }] },
  { heading: 'System', items: [{ id: 'logout', label: 'Logout', icon: 'logout', action: 'logout' }] },
];

const initialOrders = [];

const initialDistributorForm = { name: '', email: '', password: '', phone: '', location: '', status: 'Active' };
const initialStockForm = { availableQty: '', status: 'In Stock' };
const initialProductForm = { name: '', category: 'Kitchen', price: '', quantity: '' };
const productCategories = ['Kitchen', 'Cooking', 'Laundry', 'Cooling', 'Water'];

const cardClass = 'panel-hover-card rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
const panelClass = 'panel-hover-surface overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm';
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200';
const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200';
const tableHeadClass = 'px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500';
const tableCellClass = 'px-5 py-4 text-sm text-gray-600';
const primaryButtonClass = 'panel-hover-button-dark rounded-lg bg-black px-4 py-2 text-sm text-white transition';
const secondaryButtonClass = 'panel-hover-button-light rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition';
const axisStyle = { fill: '#6b7280', fontSize: 12 };
const tooltipStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px' };

const getStockStatus = (availableQty) => (availableQty < 10 ? 'Low Stock' : 'In Stock');

const getBadgeClass = (status) => {
  if (['Active', 'Accepted', 'Approved', 'In Stock', 'Dispatched', 'Delivered'].includes(status)) {
    return 'inline-flex rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white';
  }

  if (['Pending', 'Pending Dispatch', 'Processing'].includes(status)) {
    return 'inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700';
  }

  return 'inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600';
};

const getOrderActionLabel = (status) => {
  if (status === 'Pending Dispatch') {
    return 'Dispatch';
  }

  if (status === 'Dispatched') {
    return 'Mark Delivered';
  }

  return 'Completed';
};

const Distributor = ({ embedded = false, initialSection = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeSection = location.state?.section || initialSection;
  const [activeSection, setActiveSection] = useState(routeSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [registeredProducts, setRegisteredProducts] = useState([]);
  const [customerServiceRequests, setCustomerServiceRequests] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [restockRequests, setRestockRequests] = useState([]);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [editingDistributorId, setEditingDistributorId] = useState(null);
  const [distributorForm, setDistributorForm] = useState(initialDistributorForm);
  const [distributorLoading, setDistributorLoading] = useState(true);
  const [distributorSaving, setDistributorSaving] = useState(false);
  const [distributorDeletingId, setDistributorDeletingId] = useState('');
  const [distributorError, setDistributorError] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [registeredProductsLoading, setRegisteredProductsLoading] = useState(false);
  const [registeredProductsError, setRegisteredProductsError] = useState('');
  const [customerServiceRequestsLoading, setCustomerServiceRequestsLoading] = useState(false);
  const [customerServiceRequestsError, setCustomerServiceRequestsError] = useState('');
  const [restockRequestsLoading, setRestockRequestsLoading] = useState(false);
  const [restockRequestsError, setRestockRequestsError] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productSaving, setProductSaving] = useState(false);

  useEffect(() => {
    setActiveSection(routeSection);
  }, [routeSection]);

  useEffect(() => {
    let isCancelled = false;

    const loadDistributors = async () => {
      setDistributorLoading(true);
      setDistributorError('');

      try {
        const response = await distributorsApi.list();

        if (isCancelled) {
          return;
        }

        setDistributors(response.distributors || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setDistributors([]);
        setDistributorError(error.message || 'Unable to load distributors.');
      } finally {
        if (!isCancelled) {
          setDistributorLoading(false);
        }
      }
    };

    loadDistributors();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadInventory = async () => {
      setInventoryLoading(true);
      setInventoryError('');

      try {
        const response = await inventoryProductsApi.list();

        if (isCancelled) {
          return;
        }

        setInventory(response.inventoryProducts || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setInventory([]);
        setInventoryError(error.message || 'Unable to load inventory products.');
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
  }, []);

  useEffect(() => {
    if (activeSection !== 'inventory') {
      return undefined;
    }

    let isCancelled = false;

    const loadRegisteredProducts = async () => {
      setRegisteredProductsLoading(true);
      setRegisteredProductsError('');

      try {
        const response = await customerProductsApi.list();

        if (isCancelled) {
          return;
        }

        setRegisteredProducts(response.registeredProducts || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setRegisteredProducts([]);
        setRegisteredProductsError(error.message || 'Unable to load registered products.');
      } finally {
        if (!isCancelled) {
          setRegisteredProductsLoading(false);
        }
      }
    };

    loadRegisteredProducts();
    const refreshTimer = window.setInterval(loadRegisteredProducts, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== 'restock') {
      return undefined;
    }

    let isCancelled = false;

    const loadCustomerServiceRequests = async () => {
      setCustomerServiceRequestsLoading(true);
      setCustomerServiceRequestsError('');

      try {
        const response = await serviceRequestsApi.list();

        if (isCancelled) {
          return;
        }

        setCustomerServiceRequests(response.serviceRequests || []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setCustomerServiceRequests([]);
        setCustomerServiceRequestsError(error.message || 'Unable to load customer service requests.');
      } finally {
        if (!isCancelled) {
          setCustomerServiceRequestsLoading(false);
        }
      }
    };

    loadCustomerServiceRequests();
    const refreshTimer = window.setInterval(loadCustomerServiceRequests, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeSection]);

  useEffect(() => {
    if (!['restock', 'dashboard'].includes(activeSection)) {
      return undefined;
    }

    let isCancelled = false;

    const loadRestockRequests = async () => {
      setRestockRequestsLoading(true);
      setRestockRequestsError('');

      try {
        const response = await restockRequestsApi.list();

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
  }, [activeSection]);

  const userName = JSON.parse(localStorage.getItem('loginData') || '{}')?.userName || 'Distributor User';
  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (values) => !query || values.some((value) => String(value).toLowerCase().includes(query));

  const filteredDistributors = useMemo(() => distributors.filter((item) => matchesSearch([item.name, item.email, item.phone, item.location, item.status, item.totalOrders])), [distributors, query]);
  const filteredInventory = useMemo(() => inventory.filter((item) => matchesSearch([item.product, item.sku, item.availableQty, item.status])), [inventory, query]);
  const filteredRegisteredProducts = useMemo(
    () =>
      registeredProducts.filter((item) =>
        matchesSearch([
          item.productName,
          item.modelNumber,
          item.customerName,
          item.customerEmail,
          item.purchaseDate,
          item.status,
        ])),
    [registeredProducts, query]
  );
  const filteredCustomerServiceRequests = useMemo(
    () =>
      customerServiceRequests.filter((item) =>
        matchesSearch([
          item.customerName,
          item.customerEmail,
          item.customerPhone,
          item.productName,
          item.issueType,
          item.status,
          item.createdAt,
        ])),
    [customerServiceRequests, query]
  );
  const filteredOrders = useMemo(() => orders.filter((item) => matchesSearch([item.orderNo, item.retailer, item.product, item.quantity, item.destination, item.status])), [orders, query]);
  const filteredRequests = useMemo(
    () =>
      restockRequests.filter((item) =>
        matchesSearch([
          item.retailerName,
          item.retailerEmail,
          item.productName,
          item.brand,
          item.modelNumber,
          item.customerName,
          item.customerEmail,
          item.requestNote,
          item.status,
        ])),
    [restockRequests, query]
  );

  const totalOrders = orders.length;
  const activeDistributors = distributors.filter((item) => item.status === 'Active').length;
  const pendingRequests = restockRequests.filter((item) => item.status === 'Pending').length;
  const deliveredOrders = orders.filter((item) => item.status === 'Delivered').length;
  const lowStockItems = inventory.filter((item) => item.status === 'Low Stock').length;
  const availableUnits = inventory.reduce((sum, item) => sum + item.availableQty, 0);
  const fulfillmentRate = totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  const dashboardStats = [
    { title: 'Total Distributors', value: String(distributors.length), meta: 'Partner accounts onboarded' },
    { title: 'Active Distributors', value: String(activeDistributors), meta: 'Currently fulfilling requests' },
    { title: 'Pending Requests', value: String(pendingRequests), meta: 'Need stock allocation review' },
    { title: 'Total Orders', value: String(totalOrders), meta: 'Distributor orders in motion' },
  ];
  const inventoryStats = [
    { title: 'Products Tracked', value: String(inventory.length), meta: 'Across distributor inventory' },
    { title: 'Available Units', value: String(availableUnits), meta: 'Ready for fulfillment' },
    { title: 'Low Stock Items', value: String(lowStockItems), meta: 'Need replenishment planning' },
    { title: 'Registered Products', value: String(registeredProducts.length), meta: 'Saved by customers in database' },
  ];
  const orderStats = [
    { title: 'Incoming Orders', value: String(orders.filter((item) => item.status === 'Pending Dispatch').length), meta: 'Awaiting dispatch' },
    { title: 'Dispatched', value: String(orders.filter((item) => item.status === 'Dispatched').length), meta: 'On the way to retailers' },
    { title: 'Delivered', value: String(deliveredOrders), meta: 'Closed successfully' },
    { title: 'Fulfillment Rate', value: `${fulfillmentRate}%`, meta: 'Delivered against total orders' },
  ];
  const requestStats = [
    { title: 'Pending Requests', value: String(pendingRequests), meta: 'Waiting for review' },
    { title: 'Accepted', value: String(restockRequests.filter((item) => item.status === 'Accepted').length), meta: 'Approved for dispatch' },
    { title: 'Rejected', value: String(restockRequests.filter((item) => item.status === 'Rejected').length), meta: 'Closed requests' },
    { title: 'Requested Items', value: String(restockRequests.length), meta: 'Total restock asks' },
  ];
  const performanceStats = [
    { title: 'Orders Handled', value: String(totalOrders), meta: 'Current distributor workload' },
    { title: 'Active Distributors', value: String(activeDistributors), meta: 'Healthy fulfillment network' },
    { title: 'Pending Requests', value: String(pendingRequests), meta: 'Requests still open' },
    { title: 'Delivery Completion', value: `${fulfillmentRate}%`, meta: 'Completed dispatch lifecycle' },
  ];
  const performanceData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
    const months = [];
    const monthIndex = new Map();
    const today = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthIndex.set(key, months.length);
      months.push({ name: formatter.format(date), handled: 0 });
    }

    restockRequests.forEach((item) => {
      if (!item.createdAt) {
        return;
      }

      const parsed = new Date(item.createdAt);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      const targetIndex = monthIndex.get(key);
      if (targetIndex === undefined) {
        return;
      }

      months[targetIndex].handled += 1;
    });

    return months;
  }, [restockRequests]);

  const handleLogout = () => {
    localStorage.removeItem('loginData');
    localStorage.removeItem('role');
    navigate('/distributor/login');
  };

  const openSection = (sectionId, path = '/distributor/dashboard') => {
    setActiveSection(sectionId);
    navigate(path, { state: { section: sectionId } });
  };

  const getTitle = () => sections.flatMap((section) => section.items).find((item) => item.id === activeSection)?.label || 'Dashboard';

  const openProductModal = () => {
    setProductForm(initialProductForm);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setProductForm(initialProductForm);
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.category.trim()) {
      toast.error('Please add a product name and category.');
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      price: Number(productForm.price || 0),
      quantity: Number.parseInt(productForm.quantity || '0', 10),
    };

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      toast.error('Enter a valid price.');
      return;
    }

    if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
      toast.error('Enter a valid stock quantity.');
      return;
    }

    setProductSaving(true);

    try {
      const response = await inventoryProductsApi.create(payload);
      setInventory((current) => [response.inventoryProduct, ...current]);
      toast.success('Product added to distributor catalog.');
      closeProductModal();
    } catch (error) {
      toast.error(error.message || 'Unable to add product.');
    } finally {
      setProductSaving(false);
    }
  };

  const openDistributorModal = (distributor = null) => {
    if (distributor) {
      setDistributorForm({ name: distributor.name, email: distributor.email, password: '', phone: distributor.phone, location: distributor.location, status: distributor.status });
      setEditingDistributorId(distributor.id);
    } else {
      setDistributorForm(initialDistributorForm);
      setEditingDistributorId(null);
    }
    setShowDistributorModal(true);
  };

  const closeDistributorModal = () => {
    setDistributorForm(initialDistributorForm);
    setEditingDistributorId(null);
    setShowDistributorModal(false);
  };

  const handleDistributorSubmit = async (event) => {
    event.preventDefault();

    if (!distributorForm.name.trim() || !distributorForm.email.trim() || !distributorForm.phone.trim() || !distributorForm.location.trim()) {
      toast.error('Please complete all distributor details.');
      return;
    }

    if (!editingDistributorId && distributorForm.password.trim().length < 6) {
      toast.error('Distributor password must be at least 6 characters.');
      return;
    }

    setDistributorSaving(true);

    try {
      if (editingDistributorId) {
        const response = await distributorsApi.update(editingDistributorId, {
          name: distributorForm.name.trim(),
          email: distributorForm.email.trim(),
          phone: distributorForm.phone.trim(),
          location: distributorForm.location.trim(),
          status: distributorForm.status,
        });

        setDistributors((current) =>
          current.map((item) => (item.id === editingDistributorId ? response.distributor : item))
        );
        toast.success('Distributor updated successfully.');
      } else {
        const response = await distributorsApi.create({
          name: distributorForm.name.trim(),
          email: distributorForm.email.trim(),
          password: distributorForm.password,
          phone: distributorForm.phone.trim(),
          location: distributorForm.location.trim(),
          status: distributorForm.status,
        });

        setDistributors((current) => [response.distributor, ...current]);
        toast.success('Distributor added successfully.');
      }

      closeDistributorModal();
    } catch (error) {
      toast.error(error.message || 'Unable to save distributor.');
    } finally {
      setDistributorSaving(false);
    }
  };

  const handleDeleteDistributor = async (id) => {
    const distributor = distributors.find((item) => item.id === id);

    setDistributorDeletingId(id);

    try {
      await distributorsApi.remove(id);
      setDistributors((current) => current.filter((item) => item.id !== id));
      toast.success(`${distributor?.name || 'Distributor'} removed.`);
    } catch (error) {
      toast.error(error.message || 'Unable to delete distributor.');
    } finally {
      setDistributorDeletingId('');
    }
  };

  const handleViewDistributor = (distributor) => {
    toast(`${distributor.name} | ${distributor.email} | ${distributor.phone} | ${distributor.location}`);
  };

  const openStockModal = (item) => {
    setEditingInventoryItem(item);
    setStockForm({ availableQty: String(item.availableQty), status: item.status });
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setEditingInventoryItem(null);
    setStockForm(initialStockForm);
    setShowStockModal(false);
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const nextQuantity = Number.parseInt(stockForm.availableQty, 10);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0 || !editingInventoryItem) {
      toast.error('Enter a valid stock quantity.');
      return;
    }

    setInventorySaving(true);

    try {
      const response = await inventoryProductsApi.update(editingInventoryItem.id, {
        quantity: nextQuantity,
        status: stockForm.status || getStockStatus(nextQuantity),
      });

      setInventory((current) =>
        current.map((item) =>
          item.id === editingInventoryItem.id ? response.inventoryProduct : item,
        ),
      );
      toast.success('Inventory updated successfully.');
      closeStockModal();
    } catch (error) {
      toast.error(error.message || 'Unable to update inventory.');
    } finally {
      setInventorySaving(false);
    }
  };

  const handleRestockDecision = async (requestId, decision) => {
    const request = restockRequests.find((item) => item.id === requestId);
    if (!request || request.status !== 'Pending') {
      return;
    }

    try {
      const response = await restockRequestsApi.updateStatus(requestId, decision);
      setRestockRequests((current) =>
        current.map((item) => (item.id === requestId ? response.restockRequest : item)),
      );
      toast.success(
        decision === 'Accepted'
          ? 'Restock request approved.'
          : 'Restock request rejected.',
      );
    } catch (error) {
      toast.error(error.message || 'Unable to update restock request.');
    }
  };

  const handleOrderProgress = (orderId) => {
    const currentOrder = orders.find((item) => item.id === orderId);
    if (!currentOrder || currentOrder.status === 'Delivered') {
      return;
    }

    const nextStatus = currentOrder.status === 'Pending Dispatch' ? 'Dispatched' : 'Delivered';
    setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, status: nextStatus } : item)));
    toast.success(nextStatus === 'Dispatched' ? `${currentOrder.orderNo} marked as dispatched.` : `${currentOrder.orderNo} marked as delivered.`);
  };

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

  const renderPanelHeader = (title, description) => (
    <div className="border-b border-gray-200 px-5 py-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
    </div>
  );

  const renderTable = (title, description, columns, rows, keyField) => (
    <div className={panelClass}>
      {renderPanelHeader(title, description)}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={tableHeadClass}>
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
                    <td key={column.key} className={`${tableCellClass} ${column.bold ? 'font-medium text-gray-900' : ''}`}>
                      {column.render ? column.render(row) : column.badge ? <span className={getBadgeClass(row[column.key])}>{row[column.key]}</span> : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-gray-400">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChart = (title, description) => (
    <div className={panelClass}>
      {renderPanelHeader(title, description)}
      <div className="p-4">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} barCategoryGap="16%" barGap={2} margin={{ top: 10, right: 10, left: 24, bottom: 10 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth={0.5} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} orders`, 'Handled']} />
              <Bar dataKey="handled" fill="#6b7280" radius={[6, 6, 0, 0]} barSize={28} activeBar={{ fill: '#4b5563' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const dashboardView = (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Distributor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage distributor operations, stock allocation, and retailer fulfillment from one place.</p>
          </div>
          {embedded ? (
            <button
              type="button"
              onClick={() => openDistributorModal()}
              className={primaryButtonClass}
            >
              Add Distributor
            </button>
          ) : null}
        </div>
      </div>

      {renderCards(dashboardStats)}

      {distributorError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {distributorError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {renderChart('Orders Handled', 'Monthly order movement across the distributor network')}
        <div className={panelClass}>
          {renderPanelHeader('Operations Snapshot', 'Live distributor health and service indicators')}
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Fulfillment Rate</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{fulfillmentRate}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{lowStockItems}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Pending Dispatch</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{orders.filter((item) => item.status === 'Pending Dispatch').length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Open Restock Requests</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {renderTable(
        'Distributor Directory',
        'Search, add, and manage distributor contacts and account status.',
        [
          { key: 'name', label: 'Name', bold: true },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'totalOrders', label: 'Orders Count' },
          { key: 'actions', label: 'Actions', render: (row) => <div className="flex items-center gap-3"><button type="button" onClick={() => handleViewDistributor(row)} className="text-sm text-gray-700 transition hover:underline">View</button><button type="button" onClick={() => openDistributorModal(row)} className="text-sm text-gray-700 transition hover:underline">Edit</button><button type="button" onClick={() => handleDeleteDistributor(row.id)} disabled={distributorDeletingId === row.id} className="text-sm text-gray-700 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50">{distributorDeletingId === row.id ? 'Deleting...' : 'Delete'}</button></div> },
        ],
        distributorLoading ? [] : filteredDistributors,
        'id'
      )}
    </div>
  );

  const formatDisplayDate = (value) => {
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

  const inventoryView = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Track stock operations and review products registered by customers.</p>
        </div>
        <button type="button" onClick={openProductModal} className={primaryButtonClass}>
          Add Product
        </button>
      </div>
      {renderCards(inventoryStats)}
      {inventoryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {inventoryError}
        </div>
      ) : null}
      {inventoryLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
          Loading shared inventory from the admin catalog...
        </div>
      ) : null}
      {renderTable(
        'Stock Overview',
        'Products added by distributors appear here for stock handling.',
        [
          { key: 'product', label: 'Product', bold: true },
          { key: 'sku', label: 'SKU' },
          { key: 'availableQty', label: 'Available Quantity', render: (row) => `${row.availableQty} Units` },
          { key: 'status', label: 'Status', badge: true },
          { key: 'actions', label: 'Actions', render: (row) => <button type="button" onClick={() => openStockModal(row)} className={secondaryButtonClass}>Update Stock</button> },
        ],
        inventoryLoading ? [] : filteredInventory,
        'id'
      )}
      {registeredProductsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {registeredProductsError}
        </div>
      ) : null}
      {renderTable(
        'Customer Registered Products',
        'These products are synced from customer registrations and mirrored into the database products collection.',
        [
          { key: 'productName', label: 'Product', bold: true },
          { key: 'modelNumber', label: 'Model Number' },
          { key: 'customerName', label: 'Customer' },
          { key: 'purchaseDate', label: 'Purchase Date', render: (row) => formatDisplayDate(row.purchaseDate) },
          { key: 'status', label: 'Warranty Status', badge: true },
        ],
        registeredProductsLoading ? [] : filteredRegisteredProducts,
        'id'
      )}
    </div>
  );

  const ordersView = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Review incoming retailer orders, dispatch them, and track delivery progress.</p>
      </div>
      {renderCards(orderStats)}
      {renderTable(
        'Dispatch Queue',
        'Move each order from pending dispatch through delivery completion.',
        [
          { key: 'orderNo', label: 'Order', bold: true },
          { key: 'retailer', label: 'Retailer' },
          { key: 'product', label: 'Product' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'destination', label: 'Destination' },
          { key: 'status', label: 'Status', badge: true },
          { key: 'actions', label: 'Actions', render: (row) => <button type="button" onClick={() => handleOrderProgress(row.id)} disabled={row.status === 'Delivered'} className={`${secondaryButtonClass} ${row.status === 'Delivered' ? 'cursor-not-allowed opacity-50' : ''}`}>{getOrderActionLabel(row.status)}</button> },
        ],
        filteredOrders,
        'id'
      )}
    </div>
  );

  const restockView = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Restock Requests</h1>
        <p className="mt-1 text-sm text-gray-500">Review restock asks submitted by retailers and respond with approval status.</p>
      </div>
      {renderCards(requestStats)}
      {restockRequestsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {restockRequestsError}
        </div>
      ) : null}
      {renderTable(
        'Retailer Requests',
        'Each row shows the retailer, product details, and why restock was requested.',
        [
          { key: 'retailerName', label: 'Retailer', bold: true },
          { key: 'retailerEmail', label: 'Email' },
          { key: 'productName', label: 'Product' },
          { key: 'brand', label: 'Brand' },
          { key: 'modelNumber', label: 'Model' },
          { key: 'customerName', label: 'Customer' },
          { key: 'requestNote', label: 'Requirement', render: (row) => row.requestNote || 'Restock requested' },
          { key: 'requestedQuantity', label: 'Qty' },
          { key: 'createdAt', label: 'Requested On', render: (row) => formatDisplayDate(row.createdAt) },
          { key: 'status', label: 'Status', badge: true },
          { key: 'actions', label: 'Actions', render: (row) => row.status === 'Pending' ? <div className="flex items-center gap-2"><button type="button" onClick={() => handleRestockDecision(row.id, 'Accepted')} className={secondaryButtonClass}>Accept</button><button type="button" onClick={() => handleRestockDecision(row.id, 'Rejected')} className={secondaryButtonClass}>Reject</button></div> : <span className="text-sm text-gray-500">Processed</span> },
        ],
        restockRequestsLoading ? [] : filteredRequests,
        'id',
        restockRequestsLoading ? 'Loading restock requests...' : 'No restock requests yet.'
      )}
      {customerServiceRequestsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {customerServiceRequestsError}
        </div>
      ) : null}
      {renderTable(
        'Customer Service Requests',
        'Whenever a customer raises a service request, it appears here for distributor visibility.',
        [
          { key: 'customerName', label: 'Customer', bold: true },
          { key: 'productName', label: 'Product' },
          { key: 'issueType', label: 'Issue Type' },
          { key: 'customerPhone', label: 'Contact', render: (row) => row.customerPhone || row.customerEmail },
          { key: 'createdAt', label: 'Requested On', render: (row) => formatDisplayDate(row.createdAt) },
          { key: 'status', label: 'Status', badge: true },
        ],
        customerServiceRequestsLoading ? [] : filteredCustomerServiceRequests,
        'id'
      )}
    </div>
  );

  const performanceView = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Performance</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor distributor efficiency, order completion, and stock responsiveness.</p>
      </div>
      {renderCards(performanceStats)}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {renderChart('Fulfillment Analytics', 'Six-month order handling trend')}
        <div className={panelClass}>
          {renderPanelHeader('Operational Metrics', 'Focused KPIs for CRM and supply planning')}
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Available Units</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{availableUnits}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Delivered Orders</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{deliveredOrders}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{pendingRequests}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Active Network</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{activeDistributors}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const retailersView = <Retailers searchQuery={searchQuery} />;

  const settingsView = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage panel preferences and keep distributor operations aligned with CRM workflows.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          {renderPanelHeader('Account Preferences', 'Distributor profile and service coverage')}
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Distributor Name</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{`${APP_NAME} Distribution North`}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Primary Region</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">West and North India</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Support Contact</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{`ops@${APP_DOMAIN}`}</p>
            </div>
          </div>
        </div>

        <div className={panelClass}>
          {renderPanelHeader('Operational Preferences', 'Default alerts and workflow reminders')}
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Dispatch Alerts</p>
              <p className="mt-1 text-xs text-gray-500">Receive updates for newly approved orders that need dispatch.</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Low Stock Notifications</p>
              <p className="mt-1 text-xs text-gray-500">Highlight items that move below the safe distributor threshold.</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Retailer Request Summary</p>
              <p className="mt-1 text-xs text-gray-500">Keep a daily digest of accepted, pending, and rejected requests.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className={secondaryButtonClass}>Cancel</button>
              <button type="button" onClick={() => toast.success('Distributor settings saved.')} className={primaryButtonClass}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sectionView = activeSection === 'dashboard'
    ? dashboardView
    : {
      inventory: inventoryView,
      orders: ordersView,
      restock: restockView,
      retailers: retailersView,
      performance: performanceView,
      settings: settingsView,
    }[activeSection] || dashboardView;

  const distributorModal = showDistributorModal ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingDistributorId ? 'Edit Distributor' : 'Add Distributor'}
          </h2>
        </div>

        <form onSubmit={handleDistributorSubmit} className="space-y-4 p-6">
          <input type="text" placeholder="Name" value={distributorForm.name} onChange={(event) => setDistributorForm((current) => ({ ...current, name: event.target.value }))} className={inputClass} required />
          <input type="email" placeholder="Email" value={distributorForm.email} onChange={(event) => setDistributorForm((current) => ({ ...current, email: event.target.value }))} className={inputClass} required />
          {!editingDistributorId ? (
            <input type="password" placeholder="Password" value={distributorForm.password} onChange={(event) => setDistributorForm((current) => ({ ...current, password: event.target.value }))} className={inputClass} required />
          ) : null}
          <input type="text" placeholder="Phone" value={distributorForm.phone} onChange={(event) => setDistributorForm((current) => ({ ...current, phone: event.target.value }))} className={inputClass} required />
          <input type="text" placeholder="Location" value={distributorForm.location} onChange={(event) => setDistributorForm((current) => ({ ...current, location: event.target.value }))} className={inputClass} required />
          <select value={distributorForm.status} onChange={(event) => setDistributorForm((current) => ({ ...current, status: event.target.value }))} className={selectClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeDistributorModal} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" className={primaryButtonClass} disabled={distributorSaving}>
              {distributorSaving ? 'Saving...' : editingDistributorId ? 'Save' : 'Add Distributor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const stockModal = showStockModal && editingInventoryItem ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Update Stock</h2>
          <p className="mt-1 text-sm text-gray-500">{editingInventoryItem.product}</p>
        </div>

        <form onSubmit={handleStockSubmit} className="space-y-4 p-6">
          <input type="number" min="0" placeholder="Available Quantity" value={stockForm.availableQty} onChange={(event) => setStockForm((current) => ({ ...current, availableQty: event.target.value }))} className={inputClass} required />
          <select value={stockForm.status} onChange={(event) => setStockForm((current) => ({ ...current, status: event.target.value }))} className={selectClass}>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeStockModal} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={inventorySaving}
              className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {inventorySaving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const productModal = showProductModal ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Add Product</h2>
          <p className="mt-1 text-sm text-gray-500">Share this product with retailers.</p>
        </div>

        <form onSubmit={handleProductSubmit} className="space-y-4 p-6">
          <input
            type="text"
            placeholder="Product Name"
            value={productForm.name}
            onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            className={inputClass}
            required
          />
          <select
            value={productForm.category}
            onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
            className={selectClass}
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Price"
            value={productForm.price}
            onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
            className={inputClass}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Stock Quantity"
            value={productForm.quantity}
            onChange={(event) => setProductForm((current) => ({ ...current, quantity: event.target.value }))}
            className={inputClass}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeProductModal} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={productSaving}
              className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {productSaving ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const handleMenuSelect = (item) => {
    if (item.action === 'logout') {
      handleLogout();
      return;
    }

    openSection(item.id, item.path);
  };

  if (embedded) {
    return (
        <>
          <div className="space-y-6">{sectionView}</div>
          {distributorModal}
          {stockModal}
          {productModal}
        </>
      );
  }

  return (
    <>
      <PanelLayout
        panelLabel="Distributor Panel"
        title={getTitle()}
        subtitle="Fulfillment, inventory, and request management in one consistent admin-style shell."
        menuSections={sections}
        activeItem={activeSection}
        onSelectItem={handleMenuSelect}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        userName={userName}
        userEmail={`distributor@${APP_DOMAIN}`}
        userInitial="D"
        profileActions={[
          { label: 'Distributor Profile', onClick: () => {} },
          {
            label: 'Preferences',
            onClick: () => openSection('settings', '/distributor/dashboard'),
          },
        ]}
        headerActions={
          activeSection === 'dashboard' ? (
            <button
              type="button"
              onClick={() => openDistributorModal()}
              className={primaryButtonClass}
            >
              Add Distributor
            </button>
          ) : null
        }
        onLogout={handleLogout}
      >
        <div className="min-h-full">{sectionView}</div>
      </PanelLayout>

      {distributorModal}
      {stockModal}
      {productModal}
    </>
  );
};

export default Distributor;
