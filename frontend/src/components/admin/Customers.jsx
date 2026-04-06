import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { retailerCustomersApi } from '../../services/retailerCustomersApi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    activeCustomers: '0',
    premiumMembers: '0',
    newThisMonth: '0',
    repeatRate: '0%',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await retailerCustomersApi.list();
        if (isCancelled) {
          return;
        }
        setCustomers(response.customers || []);
        setStats(response.stats || stats);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        setCustomers([]);
        setStats({
          activeCustomers: '0',
          premiumMembers: '0',
          newThisMonth: '0',
          repeatRate: '0%',
        });
        setError(loadError.message || 'Unable to load customers.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadCustomers();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.tier]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [customers, searchTerm]);

  const summary = [
    { title: 'Active Customers', value: stats.activeCustomers },
    { title: 'Premium Members', value: stats.premiumMembers },
    { title: 'New This Month', value: stats.newThisMonth },
    { title: 'Repeat Rate', value: stats.repeatRate },
  ];

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Customers</h1>
        <p className={adminUi.pageDescription}>Live customer accounts and signup activity.</p>
      </div>

      <div className={adminUi.statsGrid}>
        {summary.map((stat) => (
          <div key={stat.title} className={adminUi.card}>
            <p className={adminUi.cardTitle}>{stat.title}</p>
            <p className={adminUi.cardValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search customers"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={adminUi.input}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h2 className={adminUi.panelTitle}>Customer Directory ({filteredCustomers.length})</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading customers...</div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={adminUi.tableHeader}>
                <tr>
                  <th className={adminUi.th}>Customer</th>
                  <th className={adminUi.th}>Email</th>
                  <th className={adminUi.th}>Orders</th>
                  <th className={adminUi.th}>Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.email} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{customer.name}</td>
                    <td className={adminUi.td}>{customer.email}</td>
                    <td className={adminUi.td}>{customer.orders}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(customer.tier)}>{customer.tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No customers found</div>
        )}
      </div>
    </div>
  );
};

export default Customers;
