"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { api, MapPoint, type Property } from "@/lib/api";
import MapLoadingOverlay from "./MapLoadingOverlay";
import MapRequestManager from "@/lib/mapRequestManager";
import { useViewportPrefetch } from "@/lib/useViewportPrefetch";

// Fix for default marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createModernPropertyIcon = (size: number = 32) => {
  const gradientId = `pinGradient-${Math.random().toString(36).substr(2, 9)}`;
  return L.divIcon({
    className: "modern-property-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M${size / 2} 0 C${size * 0.7} 0 ${size} ${size * 0.3} ${size} ${size * 0.6} C${size} ${size * 0.8} ${size * 0.7} ${size} ${size / 2} ${size} C${size * 0.3} ${size} 0 ${size * 0.8} 0 ${size * 0.6} C0 ${size * 0.3} ${size * 0.3} 0 ${size / 2} 0 Z" 
                fill="url(#${gradientId})" 
                stroke="white" 
                stroke-width="1.5"/>
          <path d="M${size * 0.4} ${size} L${size / 2} ${size + 6} L${size * 0.6} ${size} Z" 
                fill="url(#${gradientId})" 
                stroke="white" 
                stroke-width="1.5"/>
          <g transform="translate(${size / 2}, ${size / 2})">
            <path d="M-6 -4 L0 -8 L6 -4 L6 2 L-6 2 Z" fill="white" opacity="0.9"/>
            <rect x="-2" y="0" width="4" height="4" fill="white" opacity="0.9"/>
          </g>
        </svg>
      </div>
    `,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
};

interface SearchMapProps {
  searchQuery?: string;
  filters?: {
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
    min2Sales?: boolean;
    startDate?: string;
    endDate?: string;
  };
  onPropertyClick?: (propertyId: number) => void;
  /** Fetch full property details when user clicks a marker; used to fill popup. */
  fetchPropertyDetails?: (propertyId: number) => Promise<Property>;
  onPointsCountChange?: (count: number) => void;
  onViewportChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  /** When set, points API uses this bbox instead of reading from the map. Keeps list and points in sync. */
  viewport?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  /** When false, do not show the full-map loading overlay (e.g. show loading in list view instead). Default true. */
  showMapLoadingOverlay?: boolean;
  /** Called when map points are being fetched; use to show loading in list/sidebar. */
  onPointsLoadingChange?: (loading: boolean) => void;
}

function MapPointsUpdater({
  filters,
  searchQuery,
  viewport: viewportProp,
  onPointsUpdate,
  onPointsCountChange,
  onLoadingChange,
}: {
  filters?: SearchMapProps["filters"];
  searchQuery?: string;
  viewport?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  onPointsUpdate: (points: MapPoint[]) => void;
  onPointsCountChange?: (count: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const map = useMap();
  const requestManager = useRef(new MapRequestManager());
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastRequestKey = useRef<string>("");
  const lastZoom = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  const loadDataWithBounds = useCallback(
    async (
      north: number,
      south: number,
      east: number,
      west: number,
      zoom: number,
      immediate: boolean,
    ) => {
      const manager = requestManager.current;
      const filtersKey = JSON.stringify({
        north,
        south,
        east,
        west,
        zoom,
        county: filters?.county,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        hasGeocoding: filters?.hasGeocoding,
        hasDaftData: filters?.hasDaftData,
        min2Sales: filters?.min2Sales,
        searchQuery,
      });
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (lastRequestKey.current !== filtersKey)
        manager.cancelRequest(lastRequestKey.current);
      const makeRequest = async () => {
        if (onLoadingChange) onLoadingChange(true);
        lastRequestKey.current = filtersKey;
        try {
          const result = await manager.request(
            `map_points_${filtersKey}`,
            () =>
              api.getMapPoints({
                north,
                south,
                east,
                west,
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
            1,
          );
          if (result) {
            startTransition(() => {
              onPointsUpdate(result.points);
              if (onPointsCountChange) onPointsCountChange(result.total);
            });
          }
        } catch (error: unknown) {
          const err = error as { name?: string; code?: string };
          if (err.name !== "AbortError" && err.code !== "ERR_CANCELED") {
            console.error("Error loading map data:", err);
            startTransition(() => {
              onPointsUpdate([]);
              if (onPointsCountChange) onPointsCountChange(0);
            });
          }
        } finally {
          if (onLoadingChange) onLoadingChange(false);
        }
      };
      if (immediate) makeRequest();
      else debounceTimer.current = setTimeout(makeRequest, 400);
    },
    [
      filters,
      searchQuery,
      onPointsUpdate,
      onPointsCountChange,
      onLoadingChange,
    ],
  );

  // When viewport is provided (map page), use it so list and points share the same bbox.
  // At zoom >= 10, do not refetch when only zooming in (data already covers the smaller area).
  const ZOOM_NO_REFETCH_THRESHOLD = 10;
  useEffect(() => {
    if (!viewportProp || !map) return;
    const manager = requestManager.current;
    const zoom = map.getZoom();
    const prevZoom = lastZoom.current;
    if (
      zoom >= ZOOM_NO_REFETCH_THRESHOLD &&
      prevZoom !== null &&
      zoom > prevZoom
    ) {
      lastZoom.current = zoom;
      return;
    }
    lastZoom.current = zoom;
    loadDataWithBounds(
      viewportProp.north,
      viewportProp.south,
      viewportProp.east,
      viewportProp.west,
      zoom,
      true,
    );
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      manager.cancelAll();
    };
    // Keep dependency array fixed length (no viewportProp object) to satisfy React's rules.
  }, [
    viewportProp?.north,
    viewportProp?.south,
    viewportProp?.east,
    viewportProp?.west,
    loadDataWithBounds,
    map,
  ]);

  // When viewport is not provided, read from map on moveend/zoomend (e.g. standalone SearchMap).
  // At zoom >= 10, do not refetch when only zooming in (data already covers the smaller area).
  useEffect(() => {
    if (viewportProp != null || !map) return;
    const manager = requestManager.current;
    const ZOOM_NO_REFETCH_THRESHOLD = 10;
    const runWithMapBounds = (immediate: boolean) => {
      const bounds = map.getBounds();
      loadDataWithBounds(
        bounds.getNorth(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getWest(),
        map.getZoom(),
        immediate,
      );
    };
    const handleMoveEnd = () => runWithMapBounds(false);
    const handleZoomEnd = () => {
      const newZoom = map.getZoom();
      if (
        newZoom >= ZOOM_NO_REFETCH_THRESHOLD &&
        lastZoom.current !== null &&
        newZoom > lastZoom.current
      ) {
        lastZoom.current = newZoom;
        return;
      }
      lastZoom.current = newZoom;
      runWithMapBounds(true);
    };
    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);
    lastZoom.current = map.getZoom();
    runWithMapBounds(true);
    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      manager.cancelAll();
    };
    // Fixed deps: viewportProp as null vs object must not change array length; use a stable check.
  }, [
    loadDataWithBounds,
    map,
    viewportProp === undefined ? null : viewportProp?.north,
  ]);
  return null;
}

function CountyLayer() {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );

  useEffect(() => {
    fetch("/counties-ireland.json")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data) => data && data.type === "FeatureCollection" && setGeoJson(data),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!map || !geoJson || !geoJson.features?.length) return;
    const geoJsonLayer = L.geoJSON(geoJson, {
      style: {
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
        color: "#1d4ed8",
        weight: 1.5,
      },
      onEachFeature: (feature, layer) => {
        const name =
          feature.properties?.name ?? feature.properties?.COUNTY ?? "County";
        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.25, weight: 2 });
            l.bringToFront();
            l.bindTooltip(name, {
              permanent: false,
              direction: "top",
            }).openTooltip();
          },
          mouseout: (e) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.08, weight: 1.5 });
            l.closeTooltip();
          },
        });
      },
    });
    geoJsonLayer.addTo(map);
    layerRef.current = geoJsonLayer;
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
      layerRef.current = null;
    };
  }, [map, geoJson]);
  return null;
}

function MapRefSetter({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

function ViewportSync({
  onViewportChange,
}: {
  onViewportChange?: (b: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onViewportChange) return;
    const sync = () => {
      const b = map.getBounds();
      onViewportChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };
    map.on("moveend", sync);
    map.on("zoomend", sync);
    sync();
    return () => {
      map.off("moveend", sync);
      map.off("zoomend", sync);
    };
  }, [map, onViewportChange]);
  return null;
}

function MapClickToClosePanel({ onClose }: { onClose: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onClose) return;
    const handler = (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent?.target as HTMLElement | undefined;
      if (
        target?.closest?.(
          ".leaflet-marker-icon, .modern-property-marker, .marker-cluster",
        )
      )
        return;
      onClose();
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onClose]);
  return null;
}

function formatPopupContent(property: Property): string {
  const addr = property.address?.address || "Unknown address";
  const latest = property.price_history?.length
    ? property.price_history.reduce((a, b) =>
        a.date_of_sale > b.date_of_sale ? a : b,
      )
    : null;
  const priceStr = latest ? `€${latest.price.toLocaleString()}` : "—";
  const dateStr = latest?.date_of_sale ?? "";
  return `
    <div class="text-sm min-w-[200px] p-1">
      <strong class="block mb-2">${escapeHtml(addr)}</strong>
      <p class="mb-1 text-gray-700"><span class="font-medium">Price:</span> ${priceStr}</p>
      ${dateStr ? `<p class="mb-2 text-gray-600"><span class="font-medium">Sale:</span> ${escapeHtml(dateStr)}</p>` : ""}
      ${property.address?.county ? `<p class="mb-2 text-gray-600">${escapeHtml(property.address.county)}</p>` : ""}
      <a href="/property/${property.id}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium">View Details</a>
    </div>
  `;
}

function escapeHtml(s: string): string {
  const div =
    typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = s;
    return div.innerHTML;
  }
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CLUSTER_ZOOM_THRESHOLD = 10;

function addMarkerBehavior(
  marker: L.Marker,
  point: MapPoint,
  fetchPropertyDetails?: (propertyId: number) => Promise<Property>,
  onMarkerClick?: (propertyId: number) => void,
) {
  if (onMarkerClick) {
    marker.on("click", () => onMarkerClick(point.id));
    return;
  }
  if (fetchPropertyDetails) {
    marker.bindPopup("Loading...", { minWidth: 220, autoPan: false });
    marker.on("click", () => {
      const popup = marker.getPopup();
      if (!popup) return;
      popup.setContent("Loading...");
      marker.openPopup();
      fetchPropertyDetails(point.id)
        .then((property) => {
          popup.setContent(formatPopupContent(property));
        })
        .catch(() => {
          popup.setContent(
            '<div class="text-sm p-2 text-red-600">Failed to load details.</div>',
          );
        });
    });
  } else {
    marker.bindPopup(
      `<div class="text-sm p-1"><a href="/property/${point.id}" target="_blank" rel="noopener noreferrer" class="text-blue-600">View property</a></div>`,
      { minWidth: 120, autoPan: false },
    );
  }
}

function MarkersLayer({
  points,
  zoom,
  fetchPropertyDetails,
  onMarkerClick,
}: {
  points: MapPoint[];
  zoom: number;
  fetchPropertyDetails?: (propertyId: number) => Promise<Property>;
  onMarkerClick?: (propertyId: number) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    const useClustering = zoom >= CLUSTER_ZOOM_THRESHOLD;
    const LayerClass = useClustering
      ? (
          L as unknown as {
            markerClusterGroup: (
              opts?: Record<string, unknown>,
            ) => L.LayerGroup;
          }
        ).markerClusterGroup
      : null;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer: L.LayerGroup = LayerClass
      ? (LayerClass as (opts?: Record<string, unknown>) => L.LayerGroup)({
          chunkedLoading: true,
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        })
      : new L.LayerGroup();

    points.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: createModernPropertyIcon(32),
      });
      addMarkerBehavior(marker, point, fetchPropertyDetails, onMarkerClick);
      layer.addLayer(marker);
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, zoom, fetchPropertyDetails, onMarkerClick]);
  return null;
}

function ZoomTracker({
  points,
  fetchPropertyDetails,
  onMarkerClick,
  onZoomChange,
}: {
  points: MapPoint[];
  fetchPropertyDetails?: (propertyId: number) => Promise<Property>;
  onMarkerClick?: (propertyId: number) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => (map ? map.getZoom() : 7));

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const z = map.getZoom();
      setZoom(z);
      onZoomChange?.(z);
    };
    map.on("zoomend", update);
    update();
    return () => {
      map.off("zoomend", update);
    };
  }, [map, onZoomChange]);

  return (
    <MarkersLayer
      points={points}
      zoom={zoom}
      fetchPropertyDetails={fetchPropertyDetails}
      onMarkerClick={onMarkerClick}
    />
  );
}

function PropertyDetailPanel({
  propertyId,
  property,
  loading,
  onClose,
}: {
  propertyId: number;
  property: Property | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!propertyId) return null;

  const latestPrice = property?.price_history?.length
    ? property.price_history.reduce((a, b) =>
        a.date_of_sale > b.date_of_sale ? a : b,
      )
    : null;
  const addr = property?.address;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-[420px] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Property details
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="p-3 max-h-[min(70vh,400px)] overflow-y-auto space-y-3">
        {loading && !property ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : property ? (
          <>
            {/* Address – click to open property details in new tab */}
            <div>
              <a
                href={`/property/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
              >
                {addr?.address || addr?.formatted_address || "Unknown address"}
              </a>
              {(addr?.county || addr?.eircode || addr?.country) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {[addr.county, addr.eircode, addr.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            {/* Latest price */}
            {latestPrice && (
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                €{latestPrice.price.toLocaleString()}
                {latestPrice.date_of_sale && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({new Date(latestPrice.date_of_sale).toLocaleDateString()})
                  </span>
                )}
              </p>
            )}

            {/* Daft listing */}
            {(property.daft_title || property.daft_url) && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Listing
                </span>
                {property.daft_title && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 line-clamp-2">
                    {property.daft_title}
                  </p>
                )}
                {property.daft_url && (
                  <a
                    href={property.daft_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                  >
                    View on Daft
                  </a>
                )}
              </div>
            )}

            {/* Price history (all sales) */}
            {property.price_history && property.price_history.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Price history ({property.price_history.length})
                </span>
                <ul className="mt-1.5 space-y-1.5 text-sm">
                  {[...property.price_history]
                    .sort((a, b) =>
                      (b.date_of_sale || "").localeCompare(
                        a.date_of_sale || "",
                      ),
                    )
                    .slice(0, 10)
                    .map((h, i) => (
                      <li
                        key={h.id ?? i}
                        className="flex justify-between gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <span>
                          {h.date_of_sale
                            ? new Date(h.date_of_sale).toLocaleDateString()
                            : "—"}
                          {h.not_full_market_price && (
                            <span
                              className="text-amber-600 dark:text-amber-400 ml-1"
                              title="Not full market price"
                            >
                              *
                            </span>
                          )}
                        </span>
                        <span className="font-medium">
                          €{h.price.toLocaleString()}
                        </span>
                      </li>
                    ))}
                </ul>
                {property.price_history.length > 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{property.price_history.length - 10} more
                  </p>
                )}
              </div>
            )}

            {/* Meta */}
            {(property.daft_scraped_at || property.updated_at) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                {property.daft_scraped_at &&
                  `Scraped ${new Date(property.daft_scraped_at).toLocaleDateString()}`}
                {property.daft_scraped_at && property.updated_at && " · "}
                {property.updated_at &&
                  `Updated ${new Date(property.updated_at).toLocaleDateString()}`}
              </p>
            )}

            <a
              href={`/property/${property.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              View full details
            </a>
          </>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load details.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchMap({
  searchQuery,
  filters,
  fetchPropertyDetails,
  onPointsCountChange,
  onViewportChange,
  viewport,
  showMapLoadingOverlay = true,
  onPointsLoadingChange,
}: SearchMapProps) {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onPointsLoadingChange?.(isLoading);
  }, [isLoading, onPointsLoadingChange]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null,
  );
  const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleMarkerClick = useCallback(
    (propertyId: number) => {
      setSelectedPropertyId(propertyId);
      setPropertyDetails(null);
      setPropertyLoading(true);
      if (fetchPropertyDetails) {
        fetchPropertyDetails(propertyId)
          .then(setPropertyDetails)
          .catch(() => setPropertyDetails(null))
          .finally(() => setPropertyLoading(false));
      } else {
        setPropertyLoading(false);
      }
    },
    [fetchPropertyDetails],
  );

  useViewportPrefetch(mapRef, filters, true);

  const defaultCenter: [number, number] = [53.41291, -8.24389];
  const defaultZoom = 7;

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        ref={mapRef}
        zoomAnimation={true}
        zoomAnimationThreshold={4}
        fadeAnimation={true}
        markerZoomAnimation={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRefSetter mapRef={mapRef} />
        <CountyLayer />
        <ViewportSync onViewportChange={onViewportChange} />
        <MapClickToClosePanel onClose={() => setSelectedPropertyId(null)} />
        <MapPointsUpdater
          filters={filters}
          searchQuery={searchQuery}
          viewport={viewport}
          onPointsUpdate={setPoints}
          onPointsCountChange={onPointsCountChange}
          onLoadingChange={setIsLoading}
        />
        <ZoomTracker
          points={points}
          fetchPropertyDetails={fetchPropertyDetails}
          onMarkerClick={fetchPropertyDetails ? handleMarkerClick : undefined}
        />
      </MapContainer>
      {selectedPropertyId != null && (
        <PropertyDetailPanel
          propertyId={selectedPropertyId}
          property={propertyDetails}
          loading={propertyLoading}
          onClose={() => setSelectedPropertyId(null)}
        />
      )}
      {showMapLoadingOverlay && <MapLoadingOverlay isLoading={isLoading} />}
    </div>
  );
}
