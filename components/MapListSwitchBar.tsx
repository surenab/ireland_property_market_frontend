'use client';

import Link from 'next/link';

const MapIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export interface MapListSwitchBarProps {
  /** Which view is currently active */
  activeView: 'list' | 'map';
  /** URL for the list (search) view */
  listHref: string;
  /** URL for the map view */
  mapHref: string;
}

/**
 * Mobile-only: shows a single button to switch to the other view.
 * On list view: only "Map" button. On map view: only "List" button.
 * Rounded light-blue bar with icon + label.
 */
export default function MapListSwitchBar({ activeView, listHref, mapHref }: MapListSwitchBarProps) {
  const buttonClass =
    'flex items-center justify-center gap-2 py-2.5 px-6 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex justify-center pointer-events-none">
      <div className="pointer-events-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 shadow-md overflow-hidden">
        {activeView === 'list' ? (
          <Link href={mapHref} className={buttonClass} aria-label="View map">
            <MapIcon />
            <span>Map</span>
          </Link>
        ) : (
          <Link href={listHref} className={buttonClass} aria-label="View list">
            <ListIcon />
            <span>List</span>
          </Link>
        )}
      </div>
    </div>
  );
}
