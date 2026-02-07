'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceDistributionChartProps {
  data: Array<{
    bucket_label: string;
    min_price: number;
    max_price: number;
    count: number;
  }>;
}

export default function PriceDistributionChart({ data }: PriceDistributionChartProps) {
  const chartData = data.map((b) => ({
    ...b,
    name: b.bucket_label,
  }));

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Price Distribution (Histogram)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '0', 'Count']}
              labelFormatter={(label) => `Range: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#10b981" name="Count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
