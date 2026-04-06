import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { adminUi, statusBadge } from './adminStyles';

const Orders = () => {
  const initialOrders = [
    { id: 'ORD-5001', retailer: 'Retail Plus Delhi', product: 'Induction Cooktop', quantity: 25, status: 'Pending' },
    { id: 'ORD-5002', retailer: 'Kitchen Zone Mumbai', product: 'Washing Machine', quantity: 15, status: 'Approved' },
    { id: 'ORD-5003', retailer: 'Appliance Express Bangalore', product: 'Refrigerator', quantity: 10, status: 'Pending' },
    { id: 'ORD-5004', retailer: 'Smart Home Chennai', product: 'Mixer Grinder', quantity: 40, status: 'Rejected' },
    { id: 'ORD-5005', retailer: 'Modern Kitchen Hyderabad', product: 'Water Purifier', quantity: 20, status: 'Approved' },
    { id: 'ORD-5006', retailer: 'Kitchen Zone Mumbai', product: 'Microwave Oven', quantity: 8, status: 'Pending' },
  ];

  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.retailer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleApprove = (id) => {
    const order = orders.find((item) => item.id === id);
    setOrders(orders.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item)));
    toast.success(`Order ${id} approved! ${order?.retailer} will receive ${order?.quantity} units of ${order?.product}`);
  };

  const handleReject = (id) => {
    setOrders(orders.map((item) => (item.id === id ? { ...item, status: 'Rejected' } : item)));
    toast.error(`Order ${id} rejected. Please review the request.`);
  };

  const handlePending = (id) => {
    setOrders(orders.map((item) => (item.id === id ? { ...item, status: 'Pending' } : item)));
    toast(`Order ${id} marked as Pending`, { icon: '...' });
  };

  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];
  const stats = [
    { title: 'Total Orders', value: orders.length },
    { title: 'Pending', value: orders.filter((order) => order.status === 'Pending').length },
    { title: 'Approved', value: orders.filter((order) => order.status === 'Approved').length },
    { title: 'Rejected', value: orders.filter((order) => order.status === 'Rejected').length },
  ];

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Orders</h1>
        <p className={adminUi.pageDescription}>Manage retail and distributor orders.</p>
      </div>

      <div className={adminUi.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.title} className={adminUi.card}>
            <p className={adminUi.cardTitle}>{stat.title}</p>
            <p className={adminUi.cardValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search by retailer name"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={adminUi.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={adminUi.select}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === 'All' ? 'All Status' : status}
            </option>
          ))}
        </select>
      </div>

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h2 className={adminUi.panelTitle}>Orders List ({filteredOrders.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={adminUi.tableHeader}>
              <tr>
                <th className={adminUi.th}>Order ID</th>
                <th className={adminUi.th}>Retailer Name</th>
                <th className={adminUi.th}>Product</th>
                <th className={adminUi.th}>Quantity</th>
                <th className={adminUi.th}>Status</th>
                <th className={adminUi.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order.id} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{order.id}</td>
                    <td className={adminUi.td}>{order.retailer}</td>
                    <td className={adminUi.td}>{order.product}</td>
                    <td className={adminUi.td}>{order.quantity} units</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(order.status)}>{order.status}</span>
                    </td>
                    <td className={adminUi.td}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleApprove(order.id)} className={adminUi.textButton}>
                          Approve
                        </button>
                        <button onClick={() => handleReject(order.id)} className="text-sm text-red-600 transition hover:underline">
                          Reject
                        </button>
                        {order.status !== 'Pending' && (
                          <button onClick={() => handlePending(order.id)} className={adminUi.textButton}>
                            Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                    No orders found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredOrders.length ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-medium text-gray-700">{Math.min(endIndex, filteredOrders.length)}</span> of{' '}
            <span className="font-medium text-gray-700">{filteredOrders.length}</span> orders
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`${adminUi.secondaryButton} ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              Previous
            </button>
            <button
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || filteredOrders.length === 0}
              className={`${adminUi.secondaryButton} ${currentPage === totalPages || filteredOrders.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className={adminUi.card}>
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Status Guide</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className={statusBadge('Pending')}>Pending</span>
            <span className="text-sm text-gray-500">Order awaiting approval</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={statusBadge('Approved')}>Approved</span>
            <span className="text-sm text-gray-500">Order is approved</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={statusBadge('Rejected')}>Rejected</span>
            <span className="text-sm text-gray-500">Order has been rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
