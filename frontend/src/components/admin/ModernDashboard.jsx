import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminUi, statusBadge } from './adminStyles';

const ModernDashboard = () => {
  const revenueData = [];
  const categoryData = [];
  const salesData = [];
  const statsCards = [
    { title: 'Total Revenue', value: 'Rs 0', change: 'Live data only' },
    { title: 'Total Orders', value: '0', change: 'Live data only' },
    { title: 'Customers', value: '0', change: 'Live data only' },
    { title: 'Avg Revenue', value: 'Rs 0', change: 'Live data only' },
  ];
  const recentOrders = [];

  const chartAxis = { stroke: '#9ca3af', fontSize: 12 };
  const productChartAxis = { fill: '#6b7280', fontSize: 12 };
  const chartTooltip = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className={adminUi.page}>
      <div className={adminUi.pageHeader}>
        <div>
          <h1 className={adminUi.pageTitle}>Dashboard</h1>
          <p className={adminUi.pageDescription}>A clean view of sales, orders, and operational activity.</p>
        </div>
      </div>

      <div className={adminUi.statsGrid}>
        {statsCards.map((stat) => (
          <div key={stat.title} className={adminUi.card}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={adminUi.cardTitle}>{stat.title}</p>
                <p className={adminUi.cardValue}>{stat.value}</p>
              </div>
              <span className="text-sm font-medium text-gray-500">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={adminUi.panel}>
            <div className={adminUi.panelHeader}>
              <h3 className={adminUi.panelTitle}>Revenue Trend</h3>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={chartAxis} axisLine={false} tickLine={false} />
                  <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltip} />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
                  <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={adminUi.panel}>
          <div className={adminUi.panelHeader}>
            <h3 className={adminUi.panelTitle}>Product Category</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={82} dataKey="value" labelLine={false}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h3 className={adminUi.panelTitle}>Sales by Product</h3>
        </div>
        <div className="p-3 pb-2">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} barCategoryGap="10%" barGap={2} margin={{ top: 10, right: 10, left: 30, bottom: 10 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 2" strokeWidth={0.5} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={productChartAxis}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-16}
                  textAnchor="end"
                  height={52}
                />
                <YAxis tick={productChartAxis} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltip} cursor={{ fill: '#f8fafc' }} formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="sales" fill="#6B7280" barSize={40} radius={[6, 6, 0, 0]} activeBar={{ fill: '#4B5563' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={adminUi.panel}>
        <div className={adminUi.panelHeader}>
          <h3 className={adminUi.panelTitle}>Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={adminUi.tableHeader}>
              <tr>
                <th className={adminUi.th}>Product</th>
                <th className={adminUi.th}>Customer</th>
                <th className={adminUi.th}>Price</th>
                <th className={adminUi.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className={adminUi.tableRow}>
                    <td className={`${adminUi.td} font-medium text-gray-900`}>{order.product}</td>
                    <td className={adminUi.td}>{order.customer}</td>
                    <td className={`${adminUi.td} text-gray-800`}>{order.price}</td>
                    <td className={adminUi.td}>
                      <span className={statusBadge(order.status)}>{order.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">
                    No recent orders yet.
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

export default ModernDashboard;
