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

// Create a modern highlighted property icon
const createHighlightedIcon = () => {
  const size = 48;
  // Generate unique ID for gradient to avoid conflicts
  const gradientId = `highlightGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return L.divIcon({
    className: 'modern-highlighted-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size + 12}px;
      ">
        <svg width="${size}" height="${size + 12}" viewBox="0 0 ${size} ${size + 12}" style="filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 0 6px rgba(59, 130, 246, 0.15));">
          <!-- Gradient definition -->
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- Pin body with gradient -->
          <path d="M${size/2} 0 C${size*0.7} 0 ${size} ${size*0.3} ${size} ${size*0.6} C${size} ${size*0.8} ${size*0.7} ${size} ${size/2} ${size} C${size*0.3} ${size} 0 ${size*0.8} 0 ${size*0.6} C0 ${size*0.3} ${size*0.3} 0 ${size/2} 0 Z" 
                fill="url(#${gradientId})" 
                stroke="white" 
                stroke-width="2"/>
          <!-- Pin point -->
          <path d="M${size*0.4} ${size} L${size/2} ${size + 10} L${size*0.6} ${size} Z" 
                fill="url(#${gradientId})" 
                stroke="white" 
                stroke-width="2"/>
          <!-- Home icon -->
          <g transform="translate(${size/2}, ${size/2})">
            <path d="M-8 -5 L0 -10 L8 -5 L8 3 L-8 3 Z" 
                  fill="white" 
                  opacity="0.95"/>
            <rect x="-2.5" y="0" width="5" height="5" fill="white" opacity="0.95"/>
          </g>
        </svg>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 12)],
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

