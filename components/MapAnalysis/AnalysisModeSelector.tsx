'use client';

export type AnalysisMode = 
  | 'spatial-patterns'
  | 'hotspots'
  | 'cluster-identification'
  | 'growth-decline'
  | 'price-heatmap'
  | 'sales-heatmap';

interface AnalysisModeSelectorProps {
  mode: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
  spatialPatternType?: string;
  onSpatialPatternChange?: (type: string) => void;
  hotspotControls?: {
    radius?: number;
    intensity?: number;
  };
  onHotspotControlsChange?: (controls: { radius?: number; intensity?: number }) => void;
}

export default function AnalysisModeSelector({
  mode,
  onChange,
  spatialPatternType,
  onSpatialPatternChange,
  hotspotControls,
  onHotspotControlsChange,
}: AnalysisModeSelectorProps) {
  const modes: Array<{
    value: AnalysisMode;
    label: string;
    description: string;
    icon: string;
    color: string;
  }> = [
    { value: 'spatial-patterns', label: 'Spatial Patterns', description: 'Analyze spatial distribution patterns', icon: '🗺️', color: 'blue' },
    { value: 'hotspots', label: 'Hotspots', description: 'Identify high-activity areas', icon: '🔥', color: 'red' },
    { value: 'cluster-identification', label: 'Cluster Identification', description: 'Find property clusters with heatmap', icon: '📍', color: 'purple' },
    { value: 'growth-decline', label: 'Growth/Decline', description: 'Price change concentration', icon: '📈', color: 'green' },
    { value: 'price-heatmap', label: 'Price Heatmap', description: 'Average/median price visualization', icon: '💰', color: 'yellow' },
    { value: 'sales-heatmap', label: 'Sales Heatmap', description: 'Sales volume per cluster', icon: '📊', color: 'orange' },
  ];

  const spatialPatternTypes = [
    'Density',
    'Distribution',
    'Concentration',
    'Dispersion',
  ];

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  };

  const inactiveClass = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600';

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Data Analysis</h3>
      
      {/* Mode Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
              mode === m.value
                ? colorClasses[m.color as keyof typeof colorClasses]
                : inactiveClass + ' text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-1">{m.icon}</div>
            <div className="font-semibold text-xs sm:text-sm">{m.label}</div>
            <div className="text-xs mt-1 opacity-75 hidden sm:block">{m.description}</div>
          </button>
        ))}
      </div>

      {/* Spatial Patterns Dropdown */}
      {mode === 'spatial-patterns' && onSpatialPatternChange && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pattern Type
          </label>
          <select
            value={spatialPatternType || 'Density'}
            onChange={(e) => onSpatialPatternChange(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {spatialPatternTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hotspots Controls */}
      {mode === 'hotspots' && hotspotControls && onHotspotControlsChange && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Radius: {hotspotControls.radius || 50}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={hotspotControls.radius || 50}
              onChange={(e) => onHotspotControlsChange({ ...hotspotControls, radius: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Intensity: {hotspotControls.intensity || 0.5}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={hotspotControls.intensity || 0.5}
              onChange={(e) => onHotspotControlsChange({ ...hotspotControls, intensity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

