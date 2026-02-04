'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface PriceClusterChartProps {
  data: Array<{
    cluster_id: number;
    price_range: {
      min: number;
      max: number;
    };
    count: number;
    average_price: number;
    properties?: number[];
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PriceClusterChart({ data }: PriceClusterChartProps) {
  const chartData = data.map((cluster) => ({
    name: `€${cluster.price_range.min.toLocaleString()} - €${cluster.price_range.max.toLocaleString()}`,
    count: cluster.count,
    average: cluster.average_price,
  }));

  return (
    <div className="w-full h-96">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Price Clusters</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="count" name="Property Count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
