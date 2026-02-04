'use client';

interface MapLoadingOverlayProps {
  isLoading: boolean;
}

export default function MapLoadingOverlay({ isLoading }: MapLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div 
      className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center transition-opacity duration-300"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Spinning ring */}
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse opacity-75"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg shadow-lg">
          Loading map data...
        </p>
      </div>
    </div>
  );
}

