'use client';

import { PropertyListItem } from '@/lib/api';
import Link from 'next/link';

interface MapPropertyCardProps {
  property: PropertyListItem;
}

export default function MapPropertyCard({ property }: MapPropertyCardProps) {
  return (
    <Link href={`/property/${property.id}`} target="_blank" rel="noopener noreferrer" className="block">
      <div className="flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group">
        {/* Image placeholder - Zillow-style card */}
        <div className="shrink-0 w-28 h-24 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {property.latest_price != null ? `€${property.latest_price.toLocaleString()}` : '—'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-0.5">
            {property.address || 'Unknown address'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {[property.county, property.latest_sale_date].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </Link>
  );
}
