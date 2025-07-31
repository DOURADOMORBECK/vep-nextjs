'use client';

import { useEffect, useRef, useCallback } from 'react';

// Leaflet types
interface LeafletMap {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  eachLayer: (fn: (layer: LeafletLayer) => void) => void;
  removeLayer: (layer: LeafletLayer) => void;
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => void;
}

interface LeafletLayer {
  options?: { type?: string };
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
}

interface LeafletPolyline {
  addTo: (map: LeafletMap) => LeafletPolyline;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
}

interface LeafletStatic {
  map: (element: HTMLElement) => LeafletMap;
  marker: (coords: [number, number], options?: Record<string, unknown>) => LeafletMarker;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer;
  polyline: (coords: [number, number][], options?: Record<string, unknown>) => LeafletPolyline;
}

declare global {
  interface Window {
    L: LeafletStatic;
  }
}

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

      // Add default markers if no orders provided
      if (orders.length === 0) {
        // Sample delivery points
        const sampleOrders = [
          { lat: -23.550520, lng: -46.633308, id: '#PED-1234', customer: 'Marcos Oliveira', address: 'Rua das Flores, 123' },
          { lat: -23.557920, lng: -46.639820, id: '#PED-1235', customer: 'Ana Silva', address: 'Av. Paulista, 1000' }
        ];

        sampleOrders.forEach((order) => {
          window.L.marker([order.lat, order.lng])
            .addTo(mapInstanceRef.current!)
            .bindPopup(`<b>${order.id}</b><br>${order.customer}<br>${order.address}`);
        });

        // Draw sample route
        const routeCoords: [number, number][] = sampleOrders.map(order => [order.lat, order.lng]);
        window.L.polyline(routeCoords, { color: '#22c55e', weight: 5 }).addTo(mapInstanceRef.current!);
      }
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
    <div 
      ref={mapRef} 
      className="h-full w-full rounded-lg border border-gray-700"
      style={{ minHeight: '300px' }}
    />
  );
}