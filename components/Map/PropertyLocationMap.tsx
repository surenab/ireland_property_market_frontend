'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom highlighted icon
const createHighlightedIcon = () => {
  return L.divIcon({
    className: 'custom-highlighted-marker',
    html: `
      <div style="
        position: relative;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        width: 48px;
        height: 48px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 5px solid white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 6px rgba(59, 130, 246, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 22px;
          line-height: 1;
        ">🏠</div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  county?: string;
}

// Component to center map on property location
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 15, {
      animate: true,
      duration: 1,
    });
  }, [map, center]);
  
  return null;
}

export default function PropertyLocationMap({ 
  latitude, 
  longitude, 
  address,
  county 
}: PropertyLocationMapProps) {
  const position: [number, number] = [latitude, longitude];
  const highlightedIcon = createHighlightedIcon();

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={position} />
        <Marker position={position} icon={highlightedIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{address}</h3>
              {county && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{county}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

