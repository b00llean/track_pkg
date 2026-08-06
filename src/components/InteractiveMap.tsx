import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PackageData, Checkpoint } from '../types/tracking';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface InteractiveMapProps {
  packageData: PackageData;
  activeCheckpointId?: string;
  onSelectCheckpoint?: (id: string) => void;
}

// Map Auto-Fitter Component (Initial route fitting)
const MapBoundsFitter: React.FC<{ checkpoints: Checkpoint[] }> = ({ checkpoints }) => {
  const map = useMap();

  useEffect(() => {
    if (checkpoints && checkpoints.length > 0) {
      map.invalidateSize();
      const bounds = L.latLngBounds(checkpoints.map((cp) => [cp.latitude, cp.longitude]));
      const mapSize = map.getSize();
      // Calculate 5% padding on all sides so the path spans 90% of map viewport width or height end-to-end
      const padX = Math.max(8, Math.round(mapSize.x * 0.05));
      const padY = Math.max(8, Math.round(mapSize.y * 0.05));

      map.fitBounds(bounds, {
        paddingTopLeft: [padX, padY],
        paddingBottomRight: [padX, padY],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [checkpoints, map]);

  return null;
};

// Map Controller for Flying / Repositioning to Selected Checkpoint
const MapController: React.FC<{
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
}> = ({ checkpoints, activeCheckpointId }) => {
  const map = useMap();

  useEffect(() => {
    if (activeCheckpointId) {
      const activeCp = checkpoints.find((cp) => cp.id === activeCheckpointId);
      if (activeCp) {
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom, 13);
        map.flyTo([activeCp.latitude, activeCp.longitude], targetZoom, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
      }
    }
  }, [activeCheckpointId, checkpoints, map]);

  return null;
};

// Generate Leaflet divIcon with carrier theme colors and status symbols
const createCustomMarkerIcon = (cp: Checkpoint, isLast: boolean, isSelected: boolean) => {
  let iconEmoji = '📍';
  let badgeColor = 'bg-slate-700 text-white border-slate-600';

  if (cp.facilityType === 'origin') {
    iconEmoji = '🏭';
    badgeColor = 'bg-slate-800 text-slate-200 border-slate-600';
  } else if (cp.facilityType === 'sorting_hub') {
    iconEmoji = '📦';
    badgeColor = 'bg-purple-600 text-white border-purple-400';
  } else if (cp.status === 'delivered') {
    iconEmoji = '🏠';
    badgeColor = 'bg-emerald-500 text-white border-emerald-300';
  } else if (cp.status === 'out_for_delivery') {
    iconEmoji = '🚚';
    badgeColor = 'bg-amber-500 text-white border-amber-300';
  } else if (isLast) {
    iconEmoji = '📍';
    badgeColor = 'bg-indigo-600 text-white border-indigo-300';
  }

  const activeStyles = isSelected
    ? 'scale-125 border-indigo-400 shadow-indigo-500/80 shadow-2xl ring-4 ring-indigo-400/80 ring-offset-2 ring-offset-slate-950'
    : 'hover:scale-110';

  const html = `
    <div class="relative group flex items-center justify-center">
      ${
        isSelected || isLast
          ? `<div class="absolute -inset-3 rounded-full bg-indigo-500/50 animate-ping"></div>`
          : ''
      }
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${badgeColor} shadow-lg border-2 font-bold text-sm transition-all duration-300 ${activeStyles}">
        <span>${iconEmoji}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: `custom-leaflet-marker ${isSelected ? 'z-[1000]' : ''}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
};

// Create floating Transit Time Badge Icon for line midpoints
const createTransitTimeIcon = (durationText: string) => {
  const html = `
    <div class="flex items-center transform -translate-x-3.5 -translate-y-3.5 group">
      <!-- Underground Circle with centered Clock Icon -->
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-indigo-500/90 shadow-xl flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover:scale-110">
        <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <!-- Duration Text Badge attached seamlessly to the circle -->
      <div class="-ml-2 pl-3.5 pr-2.5 py-0.5 rounded-r-full bg-slate-950/90 border border-l-0 border-indigo-500/60 text-indigo-300 font-mono text-[10px] font-bold shadow-xl backdrop-blur-md whitespace-nowrap">
        ${durationText}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'transit-time-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

/**
 * Calculate transit duration between two timestamp strings
 */
function calculateTransitDuration(ts1: string, ts2: string): string {
  try {
    const parseTs = (s: string) => {
      const cleaned = s.replace('-', '').trim();
      const d = new Date(cleaned);
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    const ms1 = parseTs(ts1);
    const ms2 = parseTs(ts2);

    if (ms1 && ms2) {
      const diffMs = Math.abs(ms2 - ms1);
      const totalMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m transit`;
      } else if (hours > 0) {
        return `${hours}h transit`;
      } else {
        return `${mins}m transit`;
      }
    }
  } catch (e) {
    console.warn('Duration parse error', e);
  }
  return 'In transit';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  packageData,
  activeCheckpointId,
  onSelectCheckpoint,
}) => {
  const { checkpoints, carrier } = packageData;
  const polylineCoords: [number, number][] = checkpoints.map((cp) => [cp.latitude, cp.longitude]);
  const markerRefs = React.useRef<{ [key: string]: L.Marker | null }>({});

  // Automatically open popup for active checkpoint
  useEffect(() => {
    if (activeCheckpointId && markerRefs.current[activeCheckpointId]) {
      const marker = markerRefs.current[activeCheckpointId];
      marker?.openPopup();
    }
  }, [activeCheckpointId]);

  // Calculate segment midpoints and durations for transit line labels
  const segments = [];
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const cp1 = checkpoints[i];
    const cp2 = checkpoints[i + 1];

    const midLat = (cp1.latitude + cp2.latitude) / 2;
    const midLng = (cp1.longitude + cp2.longitude) / 2;
    const durationText = calculateTransitDuration(cp1.timestamp, cp2.timestamp);

    segments.push({
      id: `seg-${cp1.id}-${cp2.id}`,
      midLat,
      midLng,
      durationText,
      from: cp1.city,
      to: cp2.city,
    });
  }

  return (
    <div className="relative w-full h-[480px] lg:h-[560px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      
      {/* Map Legend & Stats Overlay */}
      <div className="absolute top-4 left-4 z-20 glass-panel px-3.5 py-2.5 rounded-xl border border-slate-800/80 shadow-xl flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-white">{carrier.name} Tracking Route</span>
        </div>
        <div className="h-4 w-px bg-slate-800"></div>
        <span className="text-xs text-slate-400 font-mono">
          {checkpoints.length} Checkpoints • {segments.length} Leg{segments.length > 1 ? 's' : ''}
        </span>
      </div>

      <MapContainer
        center={[polylineCoords[0]?.[0] || 39.8283, polylineCoords[0]?.[1] || -98.5795]}
        zoom={5}
        zoomSnap={0.25}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter Vector Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Auto fit bounds when checkpoints route changes */}
        <MapBoundsFitter checkpoints={checkpoints} />

        {/* Reposition map view when active checkpoint changes */}
        <MapController checkpoints={checkpoints} activeCheckpointId={activeCheckpointId} />

        {/* Route Polylines */}
        {polylineCoords.length > 1 && (
          <>
            {/* Outer Glow Polyline */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: carrier.accentHex || '#6366f1',
                weight: 7,
                opacity: 0.4,
                lineCap: 'round',
              }}
            />
            {/* Inner Core Animated Line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#818cf8',
                weight: 3.5,
                opacity: 0.95,
                dashArray: '8, 12',
                className: 'animated-polyline',
              }}
            />
          </>
        )}

        {/* Transit Line Midpoint Labels (Duration in Transit) */}
        {segments.map((seg) => (
          <Marker
            key={seg.id}
            position={[seg.midLat, seg.midLng]}
            icon={createTransitTimeIcon(seg.durationText)}
            interactive={false}
          />
        ))}

        {/* Checkpoint Markers & Permanent Arrival Time Labels */}
        {checkpoints.map((cp, idx) => {
          const isLast = idx === checkpoints.length - 1;
          const isSelected = cp.id === activeCheckpointId;
          const markerIcon = createCustomMarkerIcon(cp, isLast, isSelected);

          return (
            <Marker
              key={cp.id}
              position={[cp.latitude, cp.longitude]}
              icon={markerIcon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[cp.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onSelectCheckpoint?.(cp.id),
              }}
            >
              {/* Permanent Label Pin Badge displaying arrival timestamp */}
              <Tooltip
                permanent
                direction="top"
                offset={[0, -22]}
                className="custom-pin-label-tooltip"
              >
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-xl backdrop-blur-md transition-all ${
                    isSelected
                      ? 'bg-indigo-950/95 border-2 border-indigo-400 text-white shadow-indigo-500/50 scale-105'
                      : 'bg-slate-950/90 border border-slate-700/80 text-white'
                  }`}
                >
                  <span className={isSelected ? 'text-indigo-300 font-bold' : 'text-indigo-400 font-semibold'}>
                    {cp.city}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-mono text-[10px]">{cp.timestamp}</span>
                </div>
              </Tooltip>

              <Popup className="custom-dark-popup">
                <div className="space-y-1.5 p-1 min-w-[210px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <span className="font-semibold text-xs text-indigo-400">
                      Step #{cp.sequence} of {checkpoints.length}
                    </span>
                    <span className="text-[10px] text-slate-400">{cp.timestamp}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white">{cp.statusTitle}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                    <span>📍</span> {cp.location}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">{cp.details}</p>

                  {cp.weatherAlert && (
                    <div className="mt-2 p-1.5 rounded bg-amber-950/60 border border-amber-600/40 text-[10px] text-amber-300">
                      ⚠️ <strong>{cp.weatherAlert.condition}</strong>: {cp.weatherAlert.description}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
