'use client';

import { useEffect, useRef, useCallback } from 'react';

// Tipos do Leaflet expandidos
interface LeafletMap {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  eachLayer: (fn: (layer: LeafletLayer) => void) => void;
  removeLayer: (layer: LeafletLayer) => void;
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => void;
  addControl: (control: LeafletControl) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface LeafletLayer {
  options?: { type?: string };
}

// LeafletIcon interface - used by icon creation methods
// interface LeafletIcon {
//   iconSize: [number, number];
//   iconAnchor: [number, number];
//   popupAnchor: [number, number];
//   shadowSize?: [number, number];
// }

interface LeafletControl {
  addTo: (map: LeafletMap) => LeafletControl;
  remove: () => LeafletControl;
  onAdd?: (map: LeafletMap) => HTMLElement;
}

// LeafletStatic interface is defined in ClientMap.tsx

// LeafletStatic is already declared globally in ClientMap.tsx

interface DeliveryMapProps {
  orders?: Array<{
    id: string;
    customer: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

export default function DeliveryMap({ orders = [] }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  const initializeMap = useCallback(() => {
    if (window.L && mapRef.current && !mapInstanceRef.current) {
      // Default coordinates for São Paulo, Brazil
      const defaultCoords: [number, number] = [-23.550520, -46.633308];
      
      mapInstanceRef.current = window.L.map(mapRef.current).setView(defaultCoords, 12);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // No sample data - map will show empty when no real orders exist
      // This ensures users only see real delivery data
    }
  }, [orders]);

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (mapInstanceRef.current && orders.length > 0) {
      // Clear existing markers
      mapInstanceRef.current.eachLayer((layer: LeafletLayer) => {
        if (layer.options && layer.options.type === 'marker') {
          mapInstanceRef.current!.removeLayer(layer);
        }
      });

      // Add new markers
      const bounds: [number, number][] = [];
      orders.forEach((order) => {
        window.L.marker([order.lat, order.lng], { type: 'marker' })
          .addTo(mapInstanceRef.current!)
          .bindPopup(`<b>${order.id}</b><br>${order.customer}<br>${order.address}`);
        bounds.push([order.lat, order.lng]);
      });

      // Draw route if multiple orders
      if (orders.length > 1) {
        const routeCoords: [number, number][] = orders.map(order => [order.lat, order.lng]);
        window.L.polyline(routeCoords, { color: '#22c55e', weight: 5 }).addTo(mapInstanceRef.current!);
      }

      // Fit bounds to show all markers
      if (bounds.length > 0) {
        mapInstanceRef.current!.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [orders]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapRef} 
        className="h-full w-full rounded-lg border border-gray-700"
        style={{ minHeight: '300px' }}
      />
      {orders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
          <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-300 text-lg">Nenhuma entrega em andamento</p>
            <p className="text-gray-400 text-sm mt-2">As rotas de entrega aparecerão aqui quando houver pedidos</p>
          </div>
        </div>
      )}
    </div>
  );
}