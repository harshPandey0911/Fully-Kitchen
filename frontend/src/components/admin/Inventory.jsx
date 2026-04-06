import React, { useEffect, useMemo, useState } from 'react';
import { adminUi, statusBadge } from './adminStyles';
import { inventoryProductsApi } from '../../services/inventoryProductsApi';

const baseCategories = ['All', 'Cooking', 'Laundry', 'Cooling', 'Kitchen', 'Water'];
const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await inventoryProductsApi.list();

        if (isCancelled) {
          return;
        }

        setProducts(response.inventoryProducts || []);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setProducts([]);
        setError(loadError.message || 'Unable to load inventory products.');
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

  const categories = useMemo(
    () => [
      ...new Set([
        ...baseCategories,
        ...products.map((product) => product.category).filter(Boolean),
      ]),
    ],
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());
        const matchesCategory =
          selectedCategory === 'All' || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategory],
  );

  const stats = useMemo(() => {
    const totalValue = products.reduce(
      (sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0),
      0,
    );

    return [
      { title: 'Total Products', value: products.length },
      {
        title: 'In Stock',
        value: products.filter((product) => product.status === 'In Stock').length,
      },
      {
        title: 'Low Stock',
        value: products.filter((product) => product.status === 'Low Stock').length,
      },
      { title: 'Total Value', value: formatCurrency(totalValue) },
    ];
  }, [products]);

  return (
    <div className={adminUi.page}>
      <div className={adminUi.pageHeader}>
        <div>
          <h1 className={adminUi.pageTitle}>Inventory</h1>
          <p className={adminUi.pageDescription}>View distributor-added products in the shared catalog.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Search products"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={adminUi.input}
        />

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className={adminUi.select}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'All' ? 'All Categories' : category}
            </option>
          ))}
        </select>
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h2 className={adminUi.panelTitle}>Product Inventory ({filteredProducts.length})</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Loading inventory products...
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={adminUi.tableHeader}>
                  <tr>
                    <th className={adminUi.th}>Product</th>
                    <th className={adminUi.th}>Category</th>
                    <th className={adminUi.th}>Price</th>
                    <th className={adminUi.th}>Stock</th>
                    <th className={adminUi.th}>Status</th>
                    <th className={adminUi.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={adminUi.tableRow}>
                      <td className={`${adminUi.td} font-medium text-gray-900`}>
                        {product.name}
                      </td>
                      <td className={adminUi.td}>{product.category}</td>
                      <td className={`${adminUi.td} text-gray-800`}>{product.priceLabel}</td>
                      <td className={adminUi.td}>{product.quantity}</td>
                      <td className={adminUi.td}>
                        <span className={statusBadge(product.status)}>{product.status}</span>
                      </td>
                      <td className={adminUi.td}>
                        <span className="text-xs text-gray-500">Read only</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{filteredProducts.length}</span>{' '}
                of <span className="font-medium text-gray-700">{products.length}</span> products
              </p>
              <div className="text-sm text-gray-500">
                Shared inventory is synced with the distributor panel.
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No products found</div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
