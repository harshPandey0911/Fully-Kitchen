import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { adminRetailersApi } from '../../services/adminRetailersApi';

const RetailersManagement = () => {
  const [retailers, setRetailers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadRetailers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminRetailersApi.listLoggedIn();

        if (isCancelled) {
          return;
        }

        setRetailers(response.retailers || []);
      } catch (nextError) {
        if (isCancelled) {
          return;
        }

        setRetailers([]);
        setError(nextError.message || 'Unable to load retailers.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadRetailers();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredRetailers = useMemo(
    () =>
      retailers.filter((retailer) => {
        const matchesSearch =
          retailer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          retailer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          retailer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          retailer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || retailer.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [filterStatus, retailers, searchTerm],
  );

  const stats = useMemo(
    () => [
      { title: 'Total Retailers', value: retailers.length },
      { title: 'Active Retailers', value: retailers.filter((retailer) => retailer.status === 'Active').length },
      { title: 'Total Orders', value: retailers.reduce((sum, retailer) => sum + (retailer.orderCount || 0), 0) },
      { title: 'Logged In', value: retailers.filter((retailer) => retailer.lastLoginAt).length },
    ],
    [retailers],
  );

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Retailers</h1>
        <p className={adminUi.pageDescription}>Show retailers who have already logged in from the distributor-created accounts.</p>
      </div>

      <div className={adminUi.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.title} className={adminUi.card}>
            <p className={adminUi.cardTitle}>{stat.title}</p>
            <p className={adminUi.cardValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <input
          type="text"
          placeholder="Search retailers"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={adminUi.input}
        />
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className={adminUi.select}
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className={adminUi.panel}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={adminUi.tableHeader}>
              <tr>
                <th className={adminUi.th}>Retailer</th>
                <th className={adminUi.th}>Email</th>
                <th className={adminUi.th}>Phone</th>
                <th className={adminUi.th}>Location</th>
                <th className={adminUi.th}>Orders</th>
                <th className={adminUi.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRetailers.length > 0 ? (
                filteredRetailers.map((retailer) => (
                  <tr key={retailer.id} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>
                      {retailer.name}
                    </td>
                    <td className={adminUi.td}>{retailer.email}</td>
                    <td className={adminUi.td}>{retailer.phone || '—'}</td>
                    <td className={adminUi.td}>{retailer.location}</td>
                    <td className={`${adminUi.td} text-gray-800`}>{retailer.orderCount || 0}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(retailer.status)}>{retailer.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-400">
                    {loading ? 'Loading retailers...' : 'No logged-in retailers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RetailersManagement;
