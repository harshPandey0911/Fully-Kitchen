import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { restockRequestsApi } from '../../services/restockRequestsApi';

const RestockRequests = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await restockRequestsApi.list();
        if (isCancelled) {
          return;
        }
        setRequests(response.restockRequests || []);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        setRequests([]);
        setError(loadError.message || 'Unable to load restock requests.');
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

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return requests;
    }
    return requests.filter((item) =>
      [
        item.retailerName,
        item.retailerEmail,
        item.productName,
        item.brand,
        item.modelNumber,
        item.customerName,
        item.requestNote,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [requests, searchTerm]);

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
        <h1 className={adminUi.pageTitle}>Restock Requests</h1>
        <p className={adminUi.pageDescription}>All retailer restock requests and their status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search restock requests"
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
          <h2 className={adminUi.panelTitle}>Requests ({filteredRequests.length})</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading restock requests...</div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={adminUi.tableHeader}>
                <tr>
                  <th className={adminUi.th}>Retailer</th>
                  <th className={adminUi.th}>Email</th>
                  <th className={adminUi.th}>Product</th>
                  <th className={adminUi.th}>Brand</th>
                  <th className={adminUi.th}>Model</th>
                  <th className={adminUi.th}>Requirement</th>
                  <th className={adminUi.th}>Qty</th>
                  <th className={adminUi.th}>Requested On</th>
                  <th className={adminUi.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item) => (
                  <tr key={item.id} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{item.retailerName}</td>
                    <td className={adminUi.td}>{item.retailerEmail}</td>
                    <td className={adminUi.td}>{item.productName}</td>
                    <td className={adminUi.td}>{item.brand}</td>
                    <td className={adminUi.td}>{item.modelNumber}</td>
                    <td className={adminUi.td}>{item.requestNote || 'Restock requested'}</td>
                    <td className={adminUi.td}>{item.requestedQuantity}</td>
                    <td className={adminUi.td}>{formatDate(item.createdAt)}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(item.status)}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No restock requests found</div>
        )}
      </div>
    </div>
  );
};

export default RestockRequests;
