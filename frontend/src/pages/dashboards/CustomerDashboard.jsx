import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuHouse, LuPackage, LuPlus, LuUserRound, LuWrench } from 'react-icons/lu';
import Support from '../customer/Support';
import About from '../customer/About';
import CustomerHome from '../customer/CustomerHome';
import MyProducts from '../customer/MyProducts';
import RegisterProduct from '../customer/RegisterProduct';
import ServiceRequests from '../customer/ServiceRequests';
import Notifications from '../customer/Notifications';
import CustomerProfile from '../customer/CustomerProfile';
import EditProfile from '../customer/EditProfile';
import {
  buildCustomerNotifications,
  getProductImage,
  initialOwnedProducts,
  initialServiceRequests,
  ownershipProductOptions,
} from '../../data/customerOwnership';
import { APP_DOMAIN, APP_NAME } from '../../constants/branding';
import Header from '../../components/customer/dashboard/Header';
import BottomNav from '../../components/customer/dashboard/BottomNav';
import InlineFormSection from '../../components/customer/dashboard/InlineFormSection';
import ServiceRequestForm from '../../components/customer/service/ServiceRequestForm';
import { customerProductsApi } from '../../services/customerProductsApi';
import { serviceRequestsApi } from '../../services/serviceRequestsApi';
import { retailerProductsApi } from '../../services/retailerProductsApi';
import { uploadsApi } from '../../services/uploadsApi';

const navItems = [
  { id: 'home', label: 'Home', path: '/customer/home', icon: LuHouse },
  { id: 'products', label: 'Products', path: '/customer/products', icon: LuPackage },
  { id: 'register', label: 'Register', path: '/customer/register-product', icon: LuPlus, isCenter: true },
  { id: 'service', label: 'Service', path: '/customer/service', icon: LuWrench },
  { id: 'profile', label: 'Profile', path: '/customer/profile', icon: LuUserRound },
];

const profilePaths = ['/customer/profile', '/customer/edit-profile', '/customer/profile/edit', '/customer/support', '/customer/about'];
const registerModalPath = '/customer/register-product';

const technicianDirectory = {
  Repair: 'Rohit Menon',
  Installation: 'Aisha Verma',
  Replacement: 'Ananya Shah',
};

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const readArrayWithDefault = (key, fallback) => {
  const value = readStorage(key, fallback);
  return Array.isArray(value) && value.length > 0 ? value : fallback;
};

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getDefaultCustomerProfile = () => {
  const loginData = readStorage('loginData', {});
  const customerData = readStorage('customerData', {});

  return {
    fullName: loginData.userName || customerData.name || 'Customer',
    email: loginData.email || customerData.email || `customer@${APP_DOMAIN}`,
    phone: loginData.phone || customerData.phone || '',
  };
};

const getCurrentCustomerIdentity = () => {
  const loginData = readStorage('loginData', {});
  const customerData = readStorage('customerData', {});

  return {
    fullName: (loginData.userName || customerData.name || '').trim(),
    email: (loginData.email || customerData.email || '').trim().toLowerCase(),
    phone: (loginData.phone || customerData.phone || '').trim(),
  };
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState(() => readArrayWithDefault('customerOwnedProducts', initialOwnedProducts));
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [serviceRequests, setServiceRequests] = useState(() =>
    readArrayWithDefault('customerServiceRequests', initialServiceRequests),
  );
  const [readNotificationIds, setReadNotificationIds] = useState(() => readStorage('customerReadNotificationIds', []));
  const [profile, setProfile] = useState(() => readStorage('customerProfile', getDefaultCustomerProfile()));
  const [openProfile, setOpenProfile] = useState(false);
  const [activeInlineForm, setActiveInlineForm] = useState(() => (location.pathname === registerModalPath ? 'register' : null));
  const [lastContentPath, setLastContentPath] = useState(() =>
    location.pathname === registerModalPath ? '/customer/products' : location.pathname,
  );

  const notifications = useMemo(() => buildCustomerNotifications(products, serviceRequests), [products, serviceRequests]);
  const unreadCount = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;
  const currentPath = location.pathname;
  const resolvedPath = currentPath === registerModalPath ? lastContentPath : currentPath;
  const userName = profile.fullName || 'Customer';
  const avatarInitial = 'H';
  const mergedProductOptions = useMemo(() => {
    if (!Array.isArray(catalogProducts) || catalogProducts.length === 0) {
      return ownershipProductOptions;
    }

    const uniqueNames = new Set(ownershipProductOptions.map((option) => option.name.toLowerCase()));
    const catalogOptions = catalogProducts
      .map((product) => product?.name)
      .filter(Boolean)
      .map((name) => String(name).trim())
      .filter((name) => {
        const key = name.toLowerCase();
        if (!key || uniqueNames.has(key)) {
          return false;
        }
        uniqueNames.add(key);
        return true;
      })
      .map((name) => ({
        name,
        image: getProductImage(name),
      }));

    return [...ownershipProductOptions, ...catalogOptions];
  }, [catalogProducts]);
  const catalogProductCards = useMemo(() => {
    const registeredNames = new Set(
      products.map((product) => String(product.productName || '').trim().toLowerCase()).filter(Boolean),
    );

    return (catalogProducts || [])
      .filter((product) => {
        const name = String(product?.name || '').trim().toLowerCase();
        return name && !registeredNames.has(name);
      })
      .map((product) => ({
        id: `catalog-${product.id}`,
        productName: product.name,
        brand: product.category || 'Retailer Inventory',
        modelNumber: product.sku || 'N/A',
        purchaseDate: '',
        warrantyMonths: 0,
        invoiceName: '',
        priceLabel: product.priceLabel || '',
        isRegistered: false,
      }));
  }, [catalogProducts, products]);
  const displayProducts = useMemo(() => [...products, ...catalogProductCards], [products, catalogProductCards]);
  const activeNavId = activeInlineForm
    ? activeInlineForm
    : profilePaths.includes(resolvedPath)
      ? 'profile'
      : navItems.find((item) => item.path === resolvedPath)?.id || null;
  const showBasePageContent = !activeInlineForm;

  useEffect(() => {
    localStorage.setItem('customerOwnedProducts', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    let isCancelled = false;

    const loadCatalogProducts = async () => {
      try {
        const response = await retailerProductsApi.list();
        if (isCancelled) {
          return;
        }
        setCatalogProducts(Array.isArray(response.retailerProducts) ? response.retailerProducts : []);
      } catch {
        // Keep existing catalog state when backend data is unavailable.
      }
    };

    loadCatalogProducts();
    const refreshTimer = window.setInterval(loadCatalogProducts, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const currentCustomer = getCurrentCustomerIdentity();
    const customerEmail = (profile.email || currentCustomer.email || '').trim().toLowerCase();

    if (!customerEmail) {
      return undefined;
    }

    const loadRegisteredProducts = async () => {
      try {
        const response = await customerProductsApi.list(customerEmail);

        if (isCancelled) {
          return;
        }

        if (Array.isArray(response.registeredProducts) && response.registeredProducts.length > 0) {
          setProducts(response.registeredProducts);
        }
      } catch {
        // Keep local product state when backend data is unavailable.
      }
    };

    loadRegisteredProducts();

    return () => {
      isCancelled = true;
    };
  }, [profile.email]);

  useEffect(() => {
    localStorage.setItem('customerServiceRequests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    let isCancelled = false;
    const currentCustomer = getCurrentCustomerIdentity();
    const customerEmail = (profile.email || currentCustomer.email || '').trim().toLowerCase();

    if (!customerEmail) {
      return undefined;
    }

    const loadServiceRequests = async () => {
      try {
        const response = await serviceRequestsApi.list(customerEmail);

        if (isCancelled) {
          return;
        }

        if (Array.isArray(response.serviceRequests) && response.serviceRequests.length > 0) {
          setServiceRequests(response.serviceRequests);
        }
      } catch {
        // Keep local request state when backend data is unavailable.
      }
    };

    loadServiceRequests();

    return () => {
      isCancelled = true;
    };
  }, [profile.email]);

  useEffect(() => {
    localStorage.setItem('customerReadNotificationIds', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    localStorage.setItem('customerProfile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    const currentCustomer = getCurrentCustomerIdentity();

    if (!currentCustomer.fullName && !currentCustomer.email && !currentCustomer.phone) {
      return;
    }

    setProfile((current) => {
      const nextProfile = {
        fullName: currentCustomer.fullName || current.fullName || 'Customer',
        email: currentCustomer.email || current.email || '',
        phone: currentCustomer.phone || current.phone || '',
      };

      if (
        nextProfile.fullName === current.fullName &&
        nextProfile.email === current.email &&
        nextProfile.phone === current.phone
      ) {
        return current;
      }

      return nextProfile;
    });
  }, []);

  useEffect(() => {
    if (currentPath !== '/customer/notifications') {
      return;
    }

    setReadNotificationIds((current) => {
      const merged = new Set(current);
      notifications.forEach((notification) => merged.add(notification.id));
      return Array.from(merged);
    });
  }, [currentPath, notifications]);

  useEffect(() => {
    if (currentPath !== registerModalPath) {
      setLastContentPath(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    if (currentPath === registerModalPath) {
      setActiveInlineForm('register');
    }
  }, [currentPath]);

  useEffect(() => {
    if (activeInlineForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeInlineForm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-container')) {
        setOpenProfile(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpenProfile(false);
    localStorage.removeItem('loginData');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/customer/login');
  };

  const navigateWithScroll = (path) => {
    setOpenProfile(false);

    if (path === registerModalPath) {
      setLastContentPath(resolvedPath);
      setActiveInlineForm('register');
      return;
    }

    setActiveInlineForm(null);
    window.scrollTo(0, 0);
    if (currentPath !== path) {
      navigate(path);
    }
  };

  const openServiceForm = () => {
    setOpenProfile(false);

    if (products.length === 0) {
      toast('Register a product before raising a service request.');
      setLastContentPath(resolvedPath);
      setActiveInlineForm('register');
      return;
    }

    setActiveInlineForm('service');
  };

  const closeInlineForm = () => {
    setActiveInlineForm(null);

    if (currentPath === registerModalPath) {
      navigate(lastContentPath || '/customer/products', { replace: true });
    }
  };

  const handleRegisterProduct = async (payload) => {
    const currentCustomer = getCurrentCustomerIdentity();
    const customerEmail = (profile.email || currentCustomer.email || '').trim().toLowerCase();
    const customerName = (profile.fullName || currentCustomer.fullName || '').trim();

    if (!customerEmail || !customerName) {
      toast.error('Please sign in again before registering a product.');
      return false;
    }

    try {
      let invoiceUpload = null;

      if (payload.invoiceFile) {
        const uploadResponse = await uploadsApi.uploadFile(payload.invoiceFile, {
          folder: 'customer-invoices',
        });
        invoiceUpload = uploadResponse.asset || null;
      }

      const response = await customerProductsApi.register({
        customerEmail,
        customerName,
        productName: payload.productName.trim(),
        brand: payload.brand.trim(),
        modelNumber: payload.modelNumber.trim(),
        purchaseDate: payload.purchaseDate,
        warrantyMonths: Number(payload.warrantyMonths),
        invoiceName: invoiceUpload?.originalName || payload.invoiceName || '',
        invoiceUrl: invoiceUpload?.secureUrl || '',
        invoicePublicId: invoiceUpload?.publicId || '',
      });

      setProducts((current) => [response.registeredProduct, ...current]);
      setProfile((current) => ({
        ...current,
        fullName: customerName,
        email: customerEmail,
      }));
      toast.success('Product registered successfully.');
      closeInlineForm();
      return true;
    } catch (error) {
      toast.error(error.message || 'Unable to register product.');
      return false;
    }
  };

  const handleRaiseServiceRequest = async (payload) => {
    const currentCustomer = getCurrentCustomerIdentity();
    const customerEmail = (profile.email || currentCustomer.email || '').trim().toLowerCase();
    const customerName = (profile.fullName || currentCustomer.fullName || '').trim();
    const customerPhone = (profile.phone || currentCustomer.phone || '').trim();

    if (!customerEmail || !customerName) {
      toast.error('Please sign in again before raising a service request.');
      return false;
    }

    try {
      let imageUpload = null;

      if (payload.imageFile) {
        const uploadResponse = await uploadsApi.uploadFile(payload.imageFile, {
          folder: 'service-requests',
        });
        imageUpload = uploadResponse.asset || null;
      }

      const response = await serviceRequestsApi.create({
        customerEmail,
        customerName,
        customerPhone,
        productId: payload.productId,
        productName: payload.productName,
        issueType: payload.issueType,
        description: payload.description.trim(),
        imageName: imageUpload?.originalName || payload.imageName || '',
        imageUrl: imageUpload?.secureUrl || '',
        imagePublicId: imageUpload?.publicId || '',
        assignedTechnician: technicianDirectory[payload.issueType] || 'Support Desk',
      });

      setServiceRequests((current) => [response.serviceRequest, ...current]);
      toast.success('Service request submitted.');
      setActiveInlineForm(null);
      return true;
    } catch (error) {
      toast.error(error.message || 'Unable to submit service request.');
      return false;
    }
  };

  const handleProfileUpdate = (payload) => {
    const nextProfile = {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
    };

    setProfile(nextProfile);

    const loginData = readStorage('loginData', {});
    localStorage.setItem(
      'loginData',
      JSON.stringify({
        ...loginData,
        userName: nextProfile.fullName,
        email: nextProfile.email,
        phone: nextProfile.phone,
      }),
    );

    const user = readStorage('user', {});
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...user,
        userName: nextProfile.fullName,
        email: nextProfile.email,
        phone: nextProfile.phone,
      }),
    );

    const customerData = readStorage('customerData', null);
    if (customerData) {
      localStorage.setItem(
        'customerData',
        JSON.stringify({
          ...customerData,
          name: nextProfile.fullName,
          email: nextProfile.email,
          phone: nextProfile.phone,
        }),
      );
    }

    toast.success('Profile updated successfully');
    navigate('/customer/profile');
  };

  const renderPage = () => {
    switch (resolvedPath) {
      case '/customer/products':
        return <MyProducts products={displayProducts} onNavigate={navigateWithScroll} />;
      case '/customer/service':
        return (
          <ServiceRequests
            products={products}
            serviceRequests={serviceRequests}
            onNavigate={navigateWithScroll}
            onOpenServiceForm={openServiceForm}
          />
        );
      case '/customer/notifications':
        return <Notifications notifications={notifications} unreadCount={unreadCount} />;
      case '/customer/profile':
        return (
          <CustomerProfile
            profile={profile}
            avatarInitial={avatarInitial}
            products={products}
            serviceRequests={serviceRequests}
            unreadCount={unreadCount}
            onNavigate={navigateWithScroll}
          />
        );
      case '/customer/edit-profile':
      case '/customer/profile/edit':
        return <EditProfile profile={profile} onSubmit={handleProfileUpdate} onCancel={() => navigateWithScroll('/customer/profile')} />;
      case '/customer/support':
        return <Support />;
      case '/customer/about':
        return <About />;
      case '/customer/home':
      default:
        return (
          <CustomerHome
            userName={userName}
            products={products}
            serviceRequests={serviceRequests}
            notifications={notifications}
            unreadCount={unreadCount}
            onNavigate={navigateWithScroll}
            onOpenServiceForm={openServiceForm}
          />
        );
    }
  };

  return (
    <div
      className="customer-panel min-h-screen overflow-x-hidden bg-[#F8F6F4]"
      style={{
        '--customer-primary': '#8B5E3C',
        '--customer-dark': '#1E1E1E',
        '--customer-light': '#A9745B',
        '--customer-accent': '#A9745B',
        '--customer-bg': '#F8F6F4',
        '--customer-card': '#FFFFFF',
        '--customer-border': '#ECE4DD',
        '--customer-text': '#1E1E1E',
        '--customer-muted': '#6B6B6B',
        '--customer-soft': '#F3ECE7',
      }}
    >
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-[420px] px-4">
          <div className="profile-container">
            <Header
              title={APP_NAME}
              subtitle="Product Dashboard"
              unreadCount={unreadCount}
              avatarInitial={avatarInitial}
              isProfileMenuOpen={openProfile}
              onNotificationsClick={() => navigateWithScroll('/customer/notifications')}
              onToggleProfileMenu={() => setOpenProfile((current) => !current)}
              onOpenProfile={() => navigateWithScroll('/customer/profile')}
              onEditProfile={() => navigateWithScroll('/customer/profile/edit')}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto min-h-screen w-full max-w-[420px] px-4 pb-32 pt-[112px]">
        <InlineFormSection open={activeInlineForm === 'register'} title="Register Product" onClose={closeInlineForm}>
          <RegisterProduct productOptions={mergedProductOptions} onSubmit={handleRegisterProduct} onCancel={closeInlineForm} />
        </InlineFormSection>

        <InlineFormSection open={activeInlineForm === 'service'} title="Raise Service Request" onClose={closeInlineForm}>
          <ServiceRequestForm products={products} onSubmit={handleRaiseServiceRequest} onCancel={closeInlineForm} />
        </InlineFormSection>

        {showBasePageContent ? (
          <div key={resolvedPath} className="min-w-0 transition-all duration-300 ease-out">
            {renderPage()}
          </div>
        ) : null}
      </main>

      <BottomNav items={navItems} activeId={activeNavId} onNavigate={navigateWithScroll} />
    </div>
  );
};

export default CustomerDashboard;
