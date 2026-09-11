import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SOSEvent, RescueTeam, Shelter, Hospital, CitizenReport } from '../types';

interface LiveMapProps {
  sosList: SOSEvent[];
  rescueTeams: RescueTeam[];
  shelters: Shelter[];
  hospitals: Hospital[];
  reports: CitizenReport[];
  onSelectSOS?: (sos: SOSEvent) => void;
  selectedSOS?: SOSEvent | null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  sosList,
  rescueTeams,
  shelters,
  hospitals,
  reports,
  onSelectSOS,
  selectedSOS
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Ahmedabad / Gujarat (from user app context)
    const map = L.map(mapContainerRef.current, {
      center: [23.0225, 72.5714],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | AapdaSetu'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // 1. Render SOS Markers
    sosList.forEach((sos) => {
      if (!sos.location || !sos.location.coordinates) return;
      const [lng, lat] = sos.location.coordinates;
      if (lat === 0 && lng === 0) return;

      bounds.push([lat, lng]);

      const isCritical = sos.severity === 'CRITICAL';
      const isResolved = sos.status === 'RESOLVED';
      const isOffline = sos.source === 'OFFLINE_BLE' || sos.source === 'BLE_RELAY';

      const bgClass = isResolved
        ? 'bg-emerald-600'
        : isCritical
        ? 'bg-red-600'
        : sos.severity === 'HIGH'
        ? 'bg-amber-500'
        : 'bg-blue-600';

      const pulseClass = isCritical && !isResolved ? 'sos-beacon' : '';

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="w-8 h-8 rounded-full ${bgClass} ${pulseClass} flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
            🚨
          </div>
          ${isOffline ? `<span class="absolute -top-1 -right-1 px-1 py-0.2 bg-purple-800 text-[9px] text-white rounded font-mono font-bold">BLE</span>` : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-sos-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon });

      const popupContent = `
        <div class="p-2 min-w-[220px]">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold uppercase ${isCritical ? 'text-red-600' : 'text-slate-800'}">${sos.type} SOS</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold ${bgClass} text-white">${sos.severity}</span>
          </div>
          <p class="text-xs text-slate-600 mb-1"><strong>Status:</strong> ${sos.status}</p>
          <p class="text-xs text-slate-600 mb-1"><strong>Source:</strong> <span class="font-mono font-bold">${sos.source}</span> ${sos.hopCount > 0 ? `(${sos.hopCount} hops)` : ''}</p>
          <p class="text-xs text-slate-600 mb-1"><strong>Victims:</strong> ${sos.peopleCount} affected (${sos.injuredCount} injured)</p>
          ${sos.description ? `<p class="text-xs italic text-slate-700 bg-slate-100 p-1 rounded my-1">${sos.description}</p>` : ''}
          <div class="text-[10px] text-slate-500 mt-1">ID: ${sos.eventId.substring(0, 8)}...</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectSOS) onSelectSOS(sos);
      });
      layerGroup.addLayer(marker);
    });

    // 2. Render Rescue Teams
    rescueTeams.forEach((team) => {
      if (!team.location || !team.location.coordinates) return;
      const [lng, lat] = team.location.coordinates;
      bounds.push([lat, lng]);

      const icon = L.divIcon({
        html: `
          <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white">
            🚑
          </div>
        `,
        className: 'rescue-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div class="p-1">
          <p class="font-bold text-xs text-indigo-700">${team.name}</p>
          <p class="text-xs text-slate-600">Type: ${team.teamType} | Status: <strong>${team.status}</strong></p>
          <p class="text-xs text-slate-600">Contact: ${team.contactNumber}</p>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 3. Render Shelters
    shelters.forEach((shelter) => {
      if (!shelter.location || !shelter.location.coordinates) return;
      const [lng, lat] = shelter.location.coordinates;
      bounds.push([lat, lng]);

      const icon = L.divIcon({
        html: `
          <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white">
            🏕️
          </div>
        `,
        className: 'shelter-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div class="p-1">
          <p class="font-bold text-xs text-emerald-700">${shelter.name}</p>
          <p class="text-xs text-slate-600">Capacity: ${shelter.occupied} / ${shelter.capacity}</p>
          <p class="text-xs text-slate-600">Status: <strong>${shelter.status}</strong></p>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 4. Render Hospitals
    hospitals.forEach((hosp) => {
      if (!hosp.location || !hosp.location.coordinates) return;
      const [lng, lat] = hosp.location.coordinates;
      bounds.push([lat, lng]);

      const icon = L.divIcon({
        html: `
          <div class="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white">
            🏥
          </div>
        `,
        className: 'hospital-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div class="p-1">
          <p class="font-bold text-xs text-rose-700">${hosp.name}</p>
          <p class="text-xs text-slate-600">Available Beds: <strong>${hosp.availableBeds}</strong> / ${hosp.totalBeds}</p>
          <p class="text-xs text-slate-600">Available ICUs: <strong>${hosp.availableICUBeds}</strong></p>
          <p class="text-xs text-slate-600">Ambulances: ${hosp.availableAmbulances}</p>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // Pan to selected SOS if present
    if (selectedSOS && selectedSOS.location?.coordinates) {
      const [lng, lat] = selectedSOS.location.coordinates;
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [sosList, rescueTeams, shelters, hospitals, reports, selectedSOS, onSelectSOS]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs z-[1000] space-y-1">
        <div className="font-bold text-slate-700 mb-1 border-b pb-1">Map Layers</div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span><span>Critical SOS</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span><span>High SOS</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span><span>Rescue Units</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span><span>Safe Shelters</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span><span>Hospitals</span></div>
      </div>
    </div>
  );
};
