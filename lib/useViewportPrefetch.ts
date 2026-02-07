/**
 * Hook for prefetching adjacent viewport areas in the background.
 */

import { useEffect, useRef } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { api } from './api';
import MapRequestManager from './mapRequestManager';

interface PrefetchFilters {
  county?: string;
  minPrice?: number;
  maxPrice?: number;
  hasGeocoding?: boolean;
  hasDaftData?: boolean;
  min2Sales?: boolean;
  startDate?: string;
  endDate?: string;
}

export function useViewportPrefetch(
  mapRef: React.RefObject<LeafletMap | null>,
  filters?: PrefetchFilters,
  enabled: boolean = true
) {
  const requestManager = useRef(new MapRequestManager());
  const prefetchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !mapRef.current) return;

    const prefetchAdjacent = async () => {
      const map = mapRef.current;
      if (!map) return;

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Calculate adjacent viewports (north, south, east, west)
      const latSpan = bounds.getNorth() - bounds.getSouth();
      const lngSpan = bounds.getEast() - bounds.getWest();

      const adjacentViewports = [
        {
          north: bounds.getNorth() + latSpan,
          south: bounds.getNorth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          name: 'north',
        },
        {
          north: bounds.getSouth(),
          south: bounds.getSouth() - latSpan,
          east: bounds.getEast(),
          west: bounds.getWest(),
          name: 'south',
        },
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast() + lngSpan,
          west: bounds.getEast(),
          name: 'east',
        },
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getWest(),
          west: bounds.getWest() - lngSpan,
          name: 'west',
        },
      ];

      // Prefetch with lower priority
      adjacentViewports.forEach((viewport) => {
        const key = `prefetch_${viewport.name}_${viewport.north}_${viewport.south}_${viewport.east}_${viewport.west}_${zoom}`;

        requestManager.current
          .request(
            key,
            () =>
              api.getMapPoints({
                north: viewport.north,
                south: viewport.south,
                east: viewport.east,
                west: viewport.west,
                zoom,
                county: filters?.county,
                min_price: filters?.minPrice,
                max_price: filters?.maxPrice,
                has_geocoding: filters?.hasGeocoding,
                has_daft_data: filters?.hasDaftData,
                min_sales: filters?.min2Sales ? 2 : undefined,
                start_date: filters?.startDate,
                end_date: filters?.endDate,
              }),
            0 // Low priority
          )
          .catch(() => {
            // Silently fail prefetch requests
          });
      });
    };

    // Prefetch after main load completes (delay to not interfere with main request)
    prefetchTimer.current = setTimeout(prefetchAdjacent, 1000);

    return () => {
      if (prefetchTimer.current) {
        clearTimeout(prefetchTimer.current);
      }
      // Cancel all prefetch requests
      requestManager.current.cancelAll();
    };
  }, [mapRef, filters, enabled]);
}

