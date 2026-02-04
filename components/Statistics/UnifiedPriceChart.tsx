'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UnifiedPriceChartProps {
  data: Array<{
    date: string;
    average_price: number;
    median_price: number;
    std_deviation: number;
    min_price: number;
    max_price: number;
    count: number;
  }>;
  selectedMetrics: {
    average: boolean;
    median: boolean;
    stdDev: boolean;
  };
  onMetricToggle: (metric: 'average' | 'median' | 'stdDev') => void;
}

export default function UnifiedPriceChart({ data, selectedMetrics, onMetricToggle }: UnifiedPriceChartProps) {
  const metricColors = {
    average: '#3b82f6', // Blue
    median: '#10b981', // Green
    stdDev: '#f59e0b', // Amber
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Price Trends Over Time</h3>
        
        {/* Metric Selection */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.average}
              onChange={() => onMetricToggle('average')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metricColors.average }}></span>
              Average Price
            </span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.median}
              onChange={() => onMetricToggle('median')}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metricColors.median }}></span>
              Median Price
            </span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMetrics.stdDev}
              onChange={() => onMetricToggle('stdDev')}
              className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metricColors.stdDev }}></span>
              Standard Deviation
            </span>
          </label>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                if (value == null) return ['N/A', name ?? 'N/A'];
                const formattedValue = `€${value.toLocaleString()}`;
                const label = name === 'average_price' ? 'Average' : 
                             name === 'median_price' ? 'Median' : 
                             name === 'std_deviation' ? 'Std Dev' : (name ?? 'Value');
                return [formattedValue, label];
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            
            {selectedMetrics.average && (
              <Line
                type="monotone"
                dataKey="average_price"
                stroke={metricColors.average}
                name="Average Price"
                strokeWidth={2}
                dot={{ fill: metricColors.average, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {selectedMetrics.median && (
              <Line
                type="monotone"
                dataKey="median_price"
                stroke={metricColors.median}
                name="Median Price"
                strokeWidth={2}
                dot={{ fill: metricColors.median, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {selectedMetrics.stdDev && (
              <Line
                type="monotone"
                dataKey="std_deviation"
                stroke={metricColors.stdDev}
                name="Standard Deviation"
                strokeWidth={2}
                dot={{ fill: metricColors.stdDev, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

