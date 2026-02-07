'use client';

import { PropertyListItem } from '@/lib/api';
import Link from 'next/link';

interface PropertyCardProps {
  property: PropertyListItem;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link
      href={`/property/${property.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full min-h-0"
    >
      <div className="flex flex-col w-full h-full min-h-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1 group overflow-hidden">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {property.address || 'Unknown Address'}
        </h3>
        {property.county && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 flex items-center shrink-0">
            <span className="mr-2">📍</span>
            <span className="truncate">{property.county}</span>
          </p>
        )}
        {property.latest_price && (
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2 shrink-0">
            €{property.latest_price.toLocaleString()}
          </p>
        )}
        {property.latest_sale_date && (
          <p className="text-gray-500 dark:text-gray-500 text-sm flex items-center shrink-0">
            <span className="mr-2">📅</span>
            Sale Date: {property.latest_sale_date}
          </p>
        )}
        <div className="flex-1 min-h-2" aria-hidden />
        {property.latitude != null && property.longitude != null && (
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0 truncate">
            {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </Link>
  );
}
