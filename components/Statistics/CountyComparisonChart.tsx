'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CountyComparisonChartProps {
  data: Array<{
    county: string;
    property_count: number;
    average_price: number;
    median_price: number;
    min_price: number;
    max_price: number;
    price_per_sqm?: number;
  }>;
}

export default function CountyComparisonChart({ data }: CountyComparisonChartProps) {
  return (
    <div className="w-full h-96">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Average Price by County</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis dataKey="county" type="category" width={100} stroke="#6b7280" />
          <Tooltip
            formatter={(value: number | undefined) => value != null ? `€${value.toLocaleString()}` : 'N/A'}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="average_price" fill="#3b82f6" name="Average Price" radius={[0, 8, 8, 0]} />
          <Bar dataKey="median_price" fill="#10b981" name="Median Price" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
