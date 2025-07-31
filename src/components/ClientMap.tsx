'use client';

import { useEffect, useRef, useCallback } from 'react';

// Tipos do Leaflet expandidos
interface LeafletMap {
  setView: (coords: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  eachLayer: (fn: (layer: LeafletLayer) => void) => void;
  removeLayer: (layer: LeafletLayer) => void;
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => void;
  addControl: (control: any) => void;
  on: (event: string, handler: Function) => void;
}

interface LeafletLayer {
  options?: { type?: string };
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  bindTooltip: (content: string, options?: any) => LeafletMarker;
  setIcon: (icon: any) => LeafletMarker;
  on: (event: string, handler: Function) => LeafletMarker;
}

interface LeafletIcon {
  iconSize: [number, number];
  iconAnchor: [number, number];
  popupAnchor: [number, number];
  shadowSize?: [number, number];
}

interface LeafletDivIcon extends LeafletIcon {
  html: string;
  className: string;
}

interface LeafletPolyline {
  addTo: (map: LeafletMap) => LeafletPolyline;
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => LeafletTileLayer;
}

interface LeafletControl {
  addTo: (map: LeafletMap) => void;
}

interface LeafletStatic {
  map: (element: HTMLElement) => LeafletMap;
  marker: (coords: [number, number], options?: Record<string, unknown>) => LeafletMarker;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer;
  polyline: (coords: [number, number][], options?: Record<string, unknown>) => LeafletPolyline;
  divIcon: (options: Partial<LeafletDivIcon>) => any;
  icon: (options: any) => any;
  control: {
    layers: (baseLayers?: any, overlays?: any, options?: any) => LeafletControl;
  };
  layerGroup: () => any;
}

declare global {
  interface Window {
    L: LeafletStatic;
  }
}

interface Client {
  id: string;
  code: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  deliveryNotes: string;
  active: boolean;
}

interface ClientMapProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
}

export default function ClientMap({ clients, onClientClick }: ClientMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<any[]>([]);

  const initializeMap = useCallback(() => {
    if (window.L && mapRef.current && !mapInstanceRef.current) {
      // Centro de São Paulo
      const defaultCoords: [number, number] = [-23.550520, -46.633308];
      
      mapInstanceRef.current = window.L.map(mapRef.current).setView(defaultCoords, 12);
      
      // Adiciona camada de tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Adiciona controles
      const layerControl = window.L.control.layers(null, null, {
        position: 'topright'
      });
      layerControl.addTo(mapInstanceRef.current);

      // Adiciona clientes ao mapa
      addClientsToMap();
    }
  }, [clients]);

  const createClientIcon = (client: Client) => {
    const color = client.type === 'PJ' ? '#3b82f6' : '#8b5cf6'; // Azul para PJ, Roxo para PF
    const icon = client.type === 'PJ' ? 'fa-building' : 'fa-user';
    
    return window.L.divIcon({
      html: `
        <div class="client-marker" style="background-color: ${color}">
          <i class="fa-solid ${icon} text-white"></i>
        </div>
      `,
      className: 'custom-client-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Criar ícone de cluster customizado
  const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';
    let bgColor = '#22c55e';
    
    if (count > 10) {
      size = 'medium';
      bgColor = '#f59e0b';
    }
    if (count > 20) {
      size = 'large';
      bgColor = '#ef4444';
    }
    
    return window.L.divIcon({
      html: `
        <div class="cluster-marker cluster-${size}" style="background-color: ${bgColor}">
          <span>${count}</span>
        </div>
      `,
      className: 'custom-cluster-marker',
      iconSize: size === 'small' ? [30, 30] : size === 'medium' ? [35, 35] : [40, 40]
    });
  };

  const addClientsToMap = useCallback(() => {
    if (!mapInstanceRef.current || !window.L) return;

    // Limpa marcadores existentes
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Agrupa clientes por tipo
    const clientesPF = window.L.layerGroup();
    const clientesPJ = window.L.layerGroup();
    const bounds: [number, number][] = [];

    // Adiciona marcadores
    clients.forEach(client => {
      if (!client.active) return;

      const marker = window.L.marker([client.latitude, client.longitude], {
        icon: createClientIcon(client)
      });

      // Popup com informações do cliente
      const popupContent = `
        <div class="client-popup" style="min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">${client.name}</h3>
          <div style="font-size: 14px; line-height: 1.5;">
            <p style="margin: 5px 0;"><strong>Código:</strong> ${client.code}</p>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
            <p style="margin: 5px 0;"><strong>Documento:</strong> ${client.document}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${client.phone}</p>
            ${client.whatsapp ? `<p style="margin: 5px 0;"><strong>WhatsApp:</strong> ${client.whatsapp}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Endereço:</strong><br/>
              ${client.address}, ${client.number}${client.complement ? ' - ' + client.complement : ''}<br/>
              ${client.neighborhood} - ${client.city}/${client.state}<br/>
              CEP: ${client.zipCode}
            </p>
            ${client.deliveryNotes ? `<p style="margin: 5px 0;"><strong>Obs. Entrega:</strong><br/>${client.deliveryNotes}</p>` : ''}
          </div>
          ${onClientClick ? `
            <div style="margin-top: 10px; text-align: center;">
              <button onclick="window.handleClientEdit('${client.id}')" 
                      style="background: #22c55e; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer;">
                <i class="fa-solid fa-edit"></i> Editar
              </button>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Tooltip com nome
      marker.bindTooltip(client.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -32]
      });

      // Adiciona ao grupo correto
      if (client.type === 'PJ') {
        marker.addTo(clientesPJ);
      } else {
        marker.addTo(clientesPF);
      }

      markersRef.current.push(marker);
      bounds.push([client.latitude, client.longitude]);
    });

    // Adiciona grupos ao mapa
    clientesPF.addTo(mapInstanceRef.current);
    clientesPJ.addTo(mapInstanceRef.current);

    // Ajusta bounds para mostrar todos os clientes
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Adiciona legenda
    addLegend();
  }, [clients, onClientClick]);

  const addLegend = () => {
    if (!mapInstanceRef.current || !window.L) return;

    const legend = window.L.control({ position: 'bottomleft' });

    legend.onAdd = function() {
      const div = window.L.DomUtil.create('div', 'info legend');
      div.style.background = 'rgba(31, 41, 55, 0.95)';
      div.style.padding = '10px';
      div.style.borderRadius = '8px';
      div.style.border = '1px solid #4b5563';
      
      div.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: white; font-size: 14px;">Legenda</h4>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></div>
          <span style="color: #d1d5db; font-size: 12px;">Pessoa Jurídica</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 20px; height: 20px; background: #8b5cf6; border-radius: 50%; margin-right: 8px;"></div>
          <span style="color: #d1d5db; font-size: 12px;">Pessoa Física</span>
        </div>
      `;
      
      return div;
    };

    legend.addTo(mapInstanceRef.current);
  };

  useEffect(() => {
    // Função global para lidar com clique no botão editar
    if (onClientClick) {
      (window as any).handleClientEdit = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          onClientClick(client);
        }
      };
    }

    // Carrega Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);

    // Adiciona estilos customizados
    const style = document.createElement('style');
    style.textContent = `
      .custom-client-marker {
        background: transparent !important;
        border: none !important;
      }
      .client-marker {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      }
      .client-marker::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid;
        border-top-color: inherit;
      }
      .leaflet-popup-content-wrapper {
        background: #1f2937;
        color: #fff;
        border: 1px solid #374151;
      }
      .leaflet-popup-tip {
        background: #1f2937;
        border-color: #374151;
      }
      .leaflet-popup-close-button {
        color: #9ca3af !important;
      }
      .leaflet-popup-close-button:hover {
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);

    // Carrega Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      // Limpa função global
      if ((window as any).handleClientEdit) {
        delete (window as any).handleClientEdit;
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      addClientsToMap();
    }
  }, [clients, addClientsToMap]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapRef} 
        className="h-full w-full rounded-lg"
      />
      
      {/* Contador de clientes */}
      <div className="absolute top-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <div className="text-sm text-gray-300">
          <div className="font-medium text-white mb-1">Total de Clientes</div>
          <div className="flex space-x-4">
            <div>
              <span className="text-xs text-gray-400">PJ:</span>
              <span className="ml-1 font-medium text-blue-400">
                {clients.filter(c => c.active && c.type === 'PJ').length}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400">PF:</span>
              <span className="ml-1 font-medium text-purple-400">
                {clients.filter(c => c.active && c.type === 'PF').length}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total:</span>
              <span className="ml-1 font-medium text-white">
                {clients.filter(c => c.active).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}