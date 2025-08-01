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

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  bindTooltip: (content: string, options?: Record<string, unknown>) => LeafletMarker;
  setIcon: (icon: LeafletIcon) => LeafletMarker;
  on: (event: string, handler: (...args: unknown[]) => void) => LeafletMarker;
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

interface LeafletControl {
  addTo: (map: LeafletMap) => LeafletControl;
  remove: () => LeafletControl;
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
  divIcon: (options: Partial<LeafletDivIcon>) => LeafletIcon;
  icon: (options: Partial<LeafletIcon>) => LeafletIcon;
  control: {
    layers: (baseLayers?: Record<string, LeafletLayer>, overlays?: Record<string, LeafletLayer>, options?: Record<string, unknown>) => LeafletControl;
  };
  layerGroup: () => LeafletLayer;
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
  createdAt: string;
  updatedAt: string;
}

interface ClientMapProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
}

export default function ClientMap({ clients, onClientClick }: ClientMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

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
    
    const container = document.createElement('div');
    container.className = 'client-marker';
    container.style.backgroundColor = color;
    
    const iconElement = document.createElement('i');
    iconElement.className = `fa-solid ${icon} text-white`;
    container.appendChild(iconElement);
    
    return window.L.divIcon({
      html: container.outerHTML,
      className: 'custom-client-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Criar ícone de cluster customizado
  const createClusterIcon = (cluster: { getChildCount: () => number }) => {
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
    
    const container = document.createElement('div');
    container.className = `cluster-marker cluster-${size}`;
    container.style.backgroundColor = bgColor;
    
    const span = document.createElement('span');
    span.textContent = count.toString();
    container.appendChild(span);
    
    return window.L.divIcon({
      html: container.outerHTML,
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

      // Popup com informações do cliente - usando DOM API para prevenir XSS
      const popupContainer = document.createElement('div');
      popupContainer.className = 'client-popup';
      popupContainer.style.minWidth = '250px';

      const title = document.createElement('h3');
      title.style.cssText = 'margin: 0 0 10px 0; font-weight: bold; font-size: 16px;';
      title.textContent = client.name;
      popupContainer.appendChild(title);

      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'font-size: 14px; line-height: 1.5;';

      // Helper function to create info paragraphs
      const createInfoParagraph = (label: string, value: string) => {
        const p = document.createElement('p');
        p.style.margin = '5px 0';
        const strong = document.createElement('strong');
        strong.textContent = label + ':';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(' ' + value));
        return p;
      };

      infoDiv.appendChild(createInfoParagraph('Código', client.code));
      infoDiv.appendChild(createInfoParagraph('Tipo', client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'));
      infoDiv.appendChild(createInfoParagraph('Documento', client.document));
      infoDiv.appendChild(createInfoParagraph('Telefone', client.phone));
      
      if (client.whatsapp) {
        infoDiv.appendChild(createInfoParagraph('WhatsApp', client.whatsapp));
      }

      // Address paragraph
      const addressP = document.createElement('p');
      addressP.style.margin = '5px 0';
      const addressStrong = document.createElement('strong');
      addressStrong.textContent = 'Endereço:';
      addressP.appendChild(addressStrong);
      addressP.appendChild(document.createElement('br'));
      addressP.appendChild(document.createTextNode(
        `${client.address}, ${client.number}${client.complement ? ' - ' + client.complement : ''}`
      ));
      addressP.appendChild(document.createElement('br'));
      addressP.appendChild(document.createTextNode(
        `${client.neighborhood} - ${client.city}/${client.state}`
      ));
      addressP.appendChild(document.createElement('br'));
      addressP.appendChild(document.createTextNode(`CEP: ${client.zipCode}`));
      infoDiv.appendChild(addressP);

      if (client.deliveryNotes) {
        const notesP = document.createElement('p');
        notesP.style.margin = '5px 0';
        const notesStrong = document.createElement('strong');
        notesStrong.textContent = 'Obs. Entrega:';
        notesP.appendChild(notesStrong);
        notesP.appendChild(document.createElement('br'));
        notesP.appendChild(document.createTextNode(client.deliveryNotes));
        infoDiv.appendChild(notesP);
      }

      popupContainer.appendChild(infoDiv);

      if (onClientClick) {
        const buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'margin-top: 10px; text-align: center;';
        
        const editButton = document.createElement('button');
        editButton.style.cssText = 'background: #22c55e; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer;';
        editButton.onclick = () => {
          if ((window as typeof window & { handleClientEdit?: (clientId: string) => void }).handleClientEdit) {
            (window as typeof window & { handleClientEdit?: (clientId: string) => void }).handleClientEdit!(client.id);
          }
        };
        
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-edit';
        editButton.appendChild(icon);
        editButton.appendChild(document.createTextNode(' Editar'));
        
        buttonDiv.appendChild(editButton);
        popupContainer.appendChild(buttonDiv);
      }

      marker.bindPopup(popupContainer.outerHTML);
      
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
      
      // Create legend content using DOM API
      const title = document.createElement('h4');
      title.style.cssText = 'margin: 0 0 10px 0; color: white; font-size: 14px;';
      title.textContent = 'Legenda';
      div.appendChild(title);

      // PJ legend item
      const pjDiv = document.createElement('div');
      pjDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px;';
      
      const pjColorBox = document.createElement('div');
      pjColorBox.style.cssText = 'width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; margin-right: 8px;';
      pjDiv.appendChild(pjColorBox);
      
      const pjLabel = document.createElement('span');
      pjLabel.style.cssText = 'color: #d1d5db; font-size: 12px;';
      pjLabel.textContent = 'Pessoa Jurídica';
      pjDiv.appendChild(pjLabel);
      
      div.appendChild(pjDiv);

      // PF legend item
      const pfDiv = document.createElement('div');
      pfDiv.style.cssText = 'display: flex; align-items: center;';
      
      const pfColorBox = document.createElement('div');
      pfColorBox.style.cssText = 'width: 20px; height: 20px; background: #8b5cf6; border-radius: 50%; margin-right: 8px;';
      pfDiv.appendChild(pfColorBox);
      
      const pfLabel = document.createElement('span');
      pfLabel.style.cssText = 'color: #d1d5db; font-size: 12px;';
      pfLabel.textContent = 'Pessoa Física';
      pfDiv.appendChild(pfLabel);
      
      div.appendChild(pfDiv);
      
      return div;
    };

    legend.addTo(mapInstanceRef.current);
  };

  useEffect(() => {
    // Função global para lidar com clique no botão editar
    if (onClientClick) {
      (window as typeof window & { handleClientEdit?: (clientId: string) => void }).handleClientEdit = (clientId: string) => {
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
      if ((window as typeof window & { handleClientEdit?: (clientId: string) => void }).handleClientEdit) {
        delete (window as typeof window & { handleClientEdit?: (clientId: string) => void }).handleClientEdit;
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