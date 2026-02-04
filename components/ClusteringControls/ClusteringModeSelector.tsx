'use client';

interface ClusteringModeSelectorProps {
  mode: 'geographic' | 'price' | 'size' | 'temporal';
  onChange: (mode: 'geographic' | 'price' | 'size' | 'temporal') => void;
}

export default function ClusteringModeSelector({ mode, onChange }: ClusteringModeSelectorProps) {
  const modes = [
    { value: 'geographic', label: 'Geographic', description: 'Cluster by location', icon: '📍', color: 'blue' },
    { value: 'price', label: 'Price', description: 'Cluster by price ranges', icon: '💰', color: 'green' },
    { value: 'size', label: 'Size', description: 'Cluster by property size', icon: '📏', color: 'purple' },
    { value: 'temporal', label: 'Temporal', description: 'Cluster by sale date', icon: '📅', color: 'orange' },
  ] as const;

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  };

  const inactiveClass = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Clustering Mode</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
              mode === m.value
                ? colorClasses[m.color]
                : inactiveClass + ' text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="font-semibold text-sm">{m.label}</div>
            <div className="text-xs mt-1 opacity-75">{m.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
