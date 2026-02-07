"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MapFilters from "@/components/Filters/MapFilters";
import AnalysisModeSelector, {
  AnalysisMode,
} from "@/components/MapAnalysis/AnalysisModeSelector";
import { api } from "@/lib/api";

// Dynamically import map to avoid SSR issues
const PropertyMap = dynamic(() => import("@/components/Map/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

function HeatMapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL parameters
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(
    (searchParams.get("analysisMode") as AnalysisMode) || "spatial-patterns",
  );
  const [spatialPatternType, setSpatialPatternType] = useState<string>(
    searchParams.get("patternType") || "Density",
  );
  const [hotspotControls, setHotspotControls] = useState({
    radius: searchParams.get("radius")
      ? parseInt(searchParams.get("radius")!)
      : 50,
    intensity: searchParams.get("intensity")
      ? parseFloat(searchParams.get("intensity")!)
      : 0.5,
  });

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    county?: string;
    minPrice?: number;
    maxPrice?: number;
    hasGeocoding?: boolean;
    hasDaftData?: boolean;
  }>({
    county: searchParams.get("county") || undefined,
    startDate: searchParams.get("startDate") || "2010-01-01",
    endDate: searchParams.get("endDate") || "2026-12-31",
    minPrice: searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined,
    hasGeocoding:
      searchParams.get("hasGeocoding") === "true"
        ? true
        : searchParams.get("hasGeocoding") === "false"
          ? false
          : undefined,
    hasDaftData:
      searchParams.get("hasDaftData") === "true"
        ? true
        : searchParams.get("hasDaftData") === "false"
          ? false
          : undefined,
  });

  const [counties, setCounties] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false); // Start collapsed on mobile
  const [propertiesCount, setPropertiesCount] = useState(0);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth >= 640) {
        // sm breakpoint
        setShowControls(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Load counties on mount - use fallback if API fails
    const fetchCounties = async () => {
      try {
        const countiesList = await api.listCounties();
        setTimeout(() => {
          setCounties(countiesList);
        }, 0);
      } catch (error) {
        console.error("Error loading counties:", error);
        setTimeout(() => {
          setCounties([
            "Dublin",
            "Cork",
            "Galway",
            "Limerick",
            "Waterford",
            "Wexford",
            "Wicklow",
            "Kildare",
            "Meath",
            "Louth",
            "Donegal",
            "Kerry",
            "Mayo",
            "Tipperary",
            "Clare",
            "Kilkenny",
            "Westmeath",
            "Laois",
            "Offaly",
            "Cavan",
            "Sligo",
            "Roscommon",
            "Monaghan",
            "Carlow",
            "Longford",
            "Leitrim",
          ]);
        }, 0);
      }
    };
    fetchCounties();
  }, []);

  // Update URL when filters or analysis settings change (use /heatmap base path)
  useEffect(() => {
    const params = new URLSearchParams();

    if (analysisMode !== "spatial-patterns") {
      params.set("analysisMode", analysisMode);
    }

    if (spatialPatternType !== "Density") {
      params.set("patternType", spatialPatternType);
    }

    if (hotspotControls.radius !== 50) {
      params.set("radius", hotspotControls.radius.toString());
    }

    if (hotspotControls.intensity !== 0.5) {
      params.set("intensity", hotspotControls.intensity.toString());
    }

    if (filters.county) {
      params.set("county", filters.county);
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    if (filters.minPrice !== undefined) {
      params.set("minPrice", filters.minPrice.toString());
    }

    if (filters.maxPrice !== undefined) {
      params.set("maxPrice", filters.maxPrice.toString());
    }

    if (filters.hasGeocoding !== undefined) {
      params.set("hasGeocoding", filters.hasGeocoding.toString());
    }

    if (filters.hasDaftData !== undefined) {
      params.set("hasDaftData", filters.hasDaftData.toString());
    }

    const newUrl = params.toString()
      ? `/heatmap?${params.toString()}`
      : "/heatmap";
    router.replace(newUrl, { scroll: false });
  }, [analysisMode, spatialPatternType, hotspotControls, filters, router]);

  return (
    <div className="w-full" style={{ margin: 0, padding: 0 }}>
      {/* Map needs explicit height for Leaflet; use viewport minus nav (~4rem) and footer (~7rem) */}
      <div
        className="relative w-full"
        style={{ height: "calc(100vh - 5rem)", zIndex: 0 }}
      >
        <PropertyMap
          analysisMode={analysisMode}
          spatialPatternType={spatialPatternType}
          hotspotControls={hotspotControls}
          filters={filters}
          onPropertiesCountChange={setPropertiesCount}
        />
      </div>

      {/* Mobile: Backdrop overlay */}
      {showControls && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 sm:hidden z-40 transition-opacity"
          onClick={() => setShowControls(false)}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Mobile: Floating Toggle Button (when collapsed) */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 sm:hidden z-50 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 font-medium transition-all"
          aria-label="Show filters"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filters</span>
        </button>
      )}

      {/* Overlay Controls - Mobile bottom sheet, Desktop top-left */}
      <div
        className={`fixed sm:absolute ${
          showControls
            ? "bottom-0 sm:top-4 sm:bottom-auto"
            : "-bottom-full sm:top-4 sm:bottom-auto"
        } left-0 right-0 sm:left-4 sm:right-auto sm:max-w-md sm:w-[28rem] w-full transition-all duration-300 ease-in-out z-50 sm:z-[1000]`}
        style={{ pointerEvents: "auto", maxHeight: "85vh" }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto h-full"
          style={{ pointerEvents: "auto", maxHeight: "inherit" }}
        >
          <div className="sm:hidden flex justify-center mb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              HeatMap Analysis
            </h2>
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle controls"
            >
              {showControls ? (
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          </div>

          {showControls && (
            <>
              <MapFilters
                filters={filters}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                counties={counties}
                propertiesCount={propertiesCount}
              />

              <AnalysisModeSelector
                mode={analysisMode}
                onChange={setAnalysisMode}
                spatialPatternType={spatialPatternType}
                onSpatialPatternChange={setSpatialPatternType}
                hotspotControls={hotspotControls}
                onHotspotControlsChange={(controls) =>
                  setHotspotControls({
                    radius: controls.radius ?? hotspotControls.radius,
                    intensity: controls.intensity ?? hotspotControls.intensity,
                  })
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeatMapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      }
    >
      <HeatMapPageContent />
    </Suspense>
  );
}
