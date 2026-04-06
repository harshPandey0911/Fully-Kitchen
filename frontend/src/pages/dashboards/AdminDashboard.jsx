import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ModernDashboard from '../../components/admin/ModernDashboard';
import Inventory from '../../components/admin/Inventory';
import Orders from '../../components/admin/Orders';
import Customers from '../../components/admin/Customers';
import RegisteredProducts from '../../components/admin/RegisteredProducts';
import RestockRequests from '../../components/admin/RestockRequests';
import SubAdminsManagement from '../../components/admin/SubAdminsManagement';
import Reports from '../../components/admin/Reports';
import ServiceRequests from '../../components/admin/ServiceRequests';
import BusinessRules from '../../components/admin/BusinessRules';
import OperationalReports from '../../components/admin/OperationalReports';
import PerformanceReports from '../../components/admin/PerformanceReports';
import RewardSystem from '../../components/admin/RewardSystem';
import PermissionsControl from '../../components/admin/PermissionsControl';
import SystemControl from '../../components/admin/SystemControl';
import RetailersManagement from '../../components/admin/RetailersManagement';
import { adminUi } from '../../components/admin/adminStyles';
import PanelLayout from '../../components/layouts/PanelLayout';
import { APP_DOMAIN } from '../../constants/branding';
import Distributor from './Distributor';

const menuItems = [
  {
    heading: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    heading: 'Management',
    items: [
      { id: 'subadmins', label: 'Sub Admins', icon: 'users' },
      { id: 'business-rules', label: 'Business Rules', icon: 'settings' },
      { id: 'inventory-alerts', label: 'Inventory', icon: 'box' },
      { id: 'registered-products', label: 'Registered Products', icon: 'box' },
      { id: 'stock-requests', label: 'Orders', icon: 'cart' },
      { id: 'customers', label: 'Customers', icon: 'users' },
      { id: 'distributor-performance', label: 'Distributors', icon: 'truck' },
      { id: 'retailer-performance', label: 'Retailers', icon: 'store' },
    ],
  },
  {
    heading: 'Insights',
    items: [{ id: 'financial-reports', label: 'Reports', icon: 'chart' }],
  },
  {
    heading: 'Support',
    items: [
      { id: 'service-requests', label: 'Service Requests', icon: 'tool' },
      { id: 'restock-requests', label: 'Restock Requests', icon: 'refresh' },
    ],
  },
  {
    heading: 'System',
    items: [
      { id: 'permissions', label: 'Permissions', icon: 'lock' },
      { id: 'system-control', label: 'Settings', icon: 'gear' },
      { id: 'logout', label: 'Logout', icon: 'logout', action: 'logout' },
    ],
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const userName =
    JSON.parse(localStorage.getItem('loginData') || '{}')?.userName ||
    'Admin User';

  const handleLogout = () => {
    localStorage.removeItem('loginData');
    localStorage.removeItem('role');
    navigate('/admin/login');
  };

  const handlePasswordChange = (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Please fill all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordSuccess('Password changed successfully!');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess('');
    }, 2000);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ModernDashboard />;
      case 'inventory-alerts':
        return <Inventory />;
      case 'registered-products':
        return <RegisteredProducts />;
      case 'stock-requests':
        return <Orders />;
      case 'customers':
        return <Customers />;
      case 'service-requests':
        return <ServiceRequests />;
      case 'restock-requests':
        return <RestockRequests />;
      case 'subadmins':
        return <SubAdminsManagement />;
      case 'business-rules':
        return <BusinessRules />;
      case 'financial-reports':
        return <Reports />;
      case 'operational-reports':
        return <OperationalReports />;
      case 'performance-reports':
        return <PerformanceReports />;
      case 'rewards':
        return <RewardSystem />;
      case 'permissions':
        return <PermissionsControl />;
      case 'system-control':
        return <SystemControl />;
      case 'distributor-performance':
        return <Distributor embedded />;
      case 'retailer-performance':
        return <RetailersManagement />;
      default:
        return <ModernDashboard />;
    }
  };

  const currentTitle = useMemo(() => {
    const item = menuItems
      .flatMap((section) => section.items)
      .find((menuItem) => menuItem.id === activeSection);

    return item?.label || 'Dashboard';
  }, [activeSection]);

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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
        panelLabel="Admin Panel"
        title={currentTitle}
        subtitle="Sticky navigation with centralized operations and partner oversight."
        menuSections={menuItems}
        activeItem={activeSection}
        onSelectItem={handleMenuSelect}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        userName={userName}
        userEmail={`admin@${APP_DOMAIN}`}
        profileActions={[
          { label: 'Profile Settings', onClick: () => {} },
          { label: 'Notifications', onClick: () => {} },
          { label: 'Preferences', onClick: () => {} },
          {
            label: 'Change Password',
            onClick: () => {
              setShowPasswordModal(true);
              setPasswordError('');
              setPasswordSuccess('');
            },
          },
        ]}
        onLogout={handleLogout}
      >
        <div className="min-h-full bg-gray-100 text-gray-800">{renderContent()}</div>
      </PanelLayout>

      {showPasswordModal ? (
        <div className={adminUi.modalOverlay}>
          <div className={adminUi.modal}>
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
              <button
                type="button"
                onClick={resetPasswordModal}
                className="text-2xl text-gray-400 transition hover:text-gray-600"
              >
                x
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.oldPassword}
                  onChange={(event) =>
                    setPasswordData({ ...passwordData, oldPassword: event.target.value })
                  }
                  className={adminUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(event) =>
                    setPasswordData({ ...passwordData, newPassword: event.target.value })
                  }
                  className={adminUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(event) =>
                    setPasswordData({ ...passwordData, confirmPassword: event.target.value })
                  }
                  className={adminUi.input}
                />
              </div>

              {passwordError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{passwordError}</p>
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-700">{passwordSuccess}</p>
                </div>
              ) : null}

              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={resetPasswordModal}
                  className={`flex-1 ${adminUi.secondaryButton} py-2`}
                >
                  Cancel
                </button>
                <button type="submit" className={`flex-1 ${adminUi.primaryButton}`}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AdminDashboard;
