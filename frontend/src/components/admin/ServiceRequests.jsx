import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { serviceRequestsApi } from '../../services/serviceRequestsApi';

const ServiceRequests = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statuses = ['All', 'Pending', 'In Progress', 'Completed'];

  useEffect(() => {
    let isCancelled = false;

    const loadRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await serviceRequestsApi.list();
        if (isCancelled) {
          return;
        }
        setTickets(response.serviceRequests || []);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        setTickets([]);
        setError(loadError.message || 'Unable to load service requests.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadRequests();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch = [
        ticket.customerName,
        ticket.customerEmail,
        ticket.productName,
        ticket.issueType,
        ticket.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const stats = [
    { title: 'Total Tickets', value: tickets.length },
    { title: 'Pending', value: tickets.filter((ticket) => ticket.status === 'Pending').length },
    { title: 'In Progress', value: tickets.filter((ticket) => ticket.status === 'In Progress').length },
    { title: 'Completed', value: tickets.filter((ticket) => ticket.status === 'Completed').length },
  ];

  const formatDate = (value) => {
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

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Service Requests</h1>
        <p className={adminUi.pageDescription}>Manage customer service tickets and support requests.</p>
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
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={adminUi.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <h2 className={adminUi.panelTitle}>Service Tickets ({filteredTickets.length})</h2>
        </div>

        {error ? (
          <div className="px-6 py-4 text-sm text-red-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading service requests...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={adminUi.tableHeader}>
                <tr>
                  <th className={adminUi.th}>Customer</th>
                  <th className={adminUi.th}>Email</th>
                  <th className={adminUi.th}>Product</th>
                  <th className={adminUi.th}>Issue</th>
                  <th className={adminUi.th}>Requirement</th>
                  <th className={adminUi.th}>Requested On</th>
                  <th className={adminUi.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className={adminUi.tableRow}>
                      <td className={`${adminUi.td} font-medium text-gray-900`}>{ticket.customerName}</td>
                      <td className={adminUi.td}>{ticket.customerEmail}</td>
                      <td className={adminUi.td}>{ticket.productName}</td>
                      <td className={adminUi.td}>{ticket.issueType}</td>
                      <td className={adminUi.td}>{ticket.description || 'Not provided'}</td>
                      <td className={adminUi.td}>{formatDate(ticket.createdAt)}</td>
                      <td className={adminUi.td}>
                        <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-400">
                      No service requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Live Requests</p>
          <p className={adminUi.cardValue}>{tickets.length}</p>
        </div>
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Pending</p>
          <p className={adminUi.cardValue}>{tickets.filter((ticket) => ticket.status === 'Pending').length}</p>
        </div>
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Completed</p>
          <p className={adminUi.cardValue}>{tickets.filter((ticket) => ticket.status === 'Completed').length}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequests;
