import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { customerProductsApi } from '../../services/customerProductsApi';

const RegisteredProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await customerProductsApi.list();
        if (isCancelled) {
          return;
        }
        setProducts(response.registeredProducts || []);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        setProducts([]);
        setError(loadError.message || 'Unable to load registered products.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return products;
    }
    return products.filter((item) =>
      [
        item.productName,
        item.brand,
        item.modelNumber,
        item.customerName,
        item.customerEmail,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [products, searchTerm]);

  const formatDate = (value) => {
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

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Registered Products</h1>
        <p className={adminUi.pageDescription}>All products registered by customers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search by product or customer"
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
          <h2 className={adminUi.panelTitle}>Registrations ({filteredProducts.length})</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading registrations...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={adminUi.tableHeader}>
                <tr>
                  <th className={adminUi.th}>Product</th>
                  <th className={adminUi.th}>Brand</th>
                  <th className={adminUi.th}>Model</th>
                  <th className={adminUi.th}>Customer</th>
                  <th className={adminUi.th}>Email</th>
                  <th className={adminUi.th}>Purchase Date</th>
                  <th className={adminUi.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => (
                  <tr key={item.id} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{item.productName}</td>
                    <td className={adminUi.td}>{item.brand}</td>
                    <td className={adminUi.td}>{item.modelNumber}</td>
                    <td className={adminUi.td}>{item.customerName}</td>
                    <td className={adminUi.td}>{item.customerEmail}</td>
                    <td className={adminUi.td}>{formatDate(item.purchaseDate)}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(item.status)}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No registrations found</div>
        )}
      </div>
    </div>
  );
};

export default RegisteredProducts;
