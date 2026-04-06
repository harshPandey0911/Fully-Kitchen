import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminUi, statusBadge } from './adminStyles';

const Reports = () => {
  const monthlySalesData = [];
  const productSalesData = [];
  const categoryData = [];

  const colors = ['#1d4ed8', '#3b82f6', '#60a5fa', '#94a3b8', '#64748b'];
  const totalRevenue = monthlySalesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = monthlySalesData.reduce((sum, item) => sum + item.orders, 0);
  const topProduct = productSalesData.reduce(
    (max, item) => (item.revenue > max.revenue ? item : max),
    { product: 'No data', revenue: 0, units: 0 }
  );
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const topCategoryRevenue = categoryData.length ? Math.max(...categoryData.map((category) => category.revenue)) : 0;

  const formatCurrency = (value) => {
    if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
    return `Rs ${value}`;
  };

  const stats = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue) },
    { title: 'Total Orders', value: totalOrders.toLocaleString() },
    { title: 'Top Product', value: topProduct.product },
  ];

  const chartAxis = { stroke: '#9ca3af', fontSize: 12 };
  const chartTooltip = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>Reports</h1>
        <p className={adminUi.pageDescription}>Business insights and performance metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className={adminUi.card}>
            <p className={adminUi.cardTitle}>{stat.title}</p>
            <p className={adminUi.cardValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminUi.panel}>
          <div className={adminUi.panelHeader}>
            <h2 className={adminUi.panelTitle}>Monthly Sales Trend</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
                <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} formatter={(value) => `Rs ${value}k`} />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={adminUi.panel}>
          <div className={adminUi.panelHeader}>
            <h2 className={adminUi.panelTitle}>Product Sales Performance</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="product" tick={chartAxis} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="units" fill="#9ca3af" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={adminUi.panel}>
          <div className={adminUi.panelHeader}>
            <h2 className={adminUi.panelTitle}>Orders Trend</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
                <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} formatter={(value) => value.toLocaleString()} />
                <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={adminUi.panel}>
          <div className={adminUi.panelHeader}>
            <h2 className={adminUi.panelTitle}>Revenue by Category</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={82} dataKey="value" labelLine={false}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h2 className={adminUi.panelTitle}>Detailed Product Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={adminUi.tableHeader}>
              <tr>
                <th className={adminUi.th}>Product</th>
                <th className={adminUi.th}>Units Sold</th>
                <th className={adminUi.th}>Revenue</th>
                <th className={adminUi.th}>Avg Price</th>
                <th className={adminUi.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {productSalesData.map((item) => {
                const avgPrice = item.revenue / item.units;
                return (
                  <tr key={item.product} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{item.product}</td>
                    <td className={adminUi.td}>{item.units.toLocaleString()}</td>
                    <td className={`${adminUi.td} text-gray-800`}>{formatCurrency(item.revenue)}</td>
                    <td className={adminUi.td}>Rs {avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge('Active')}>Active</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Average Order Value</p>
          <p className={adminUi.cardValue}>
            Rs {averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Monthly Average Orders</p>
          <p className={adminUi.cardValue}>{(totalOrders / 12).toFixed(0)}</p>
        </div>
        <div className={adminUi.card}>
          <p className={adminUi.cardTitle}>Top Category Revenue</p>
          <p className={adminUi.cardValue}>{formatCurrency(topCategoryRevenue)}</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
