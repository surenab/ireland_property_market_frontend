'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceTrendChartProps {
  data: Array<{
    date: string;
    average_price: number;
    median_price: number;
    min_price: number;
    max_price: number;
    count: number;
  }>;
}

export default function PriceTrendChart({ data }: PriceTrendChartProps) {
  return (
    <div className="w-full h-96">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Price Trends Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            formatter={(value: number | undefined) => value != null ? `€${value.toLocaleString()}` : 'N/A'}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="average_price"
            stroke="#3b82f6"
            name="Average Price"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="median_price"
            stroke="#10b981"
            name="Median Price"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
