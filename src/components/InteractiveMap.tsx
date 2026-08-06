import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PackageData, LocationGroup } from '../types/tracking';
import { groupCheckpointsByLocation } from '../utils/grouping';

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
const MapBoundsFitter: React.FC<{ groups: LocationGroup[] }> = ({ groups }) => {
  const map = useMap();

  useEffect(() => {
    if (groups && groups.length > 0) {
      map.invalidateSize();
      const bounds = L.latLngBounds(groups.map((g) => [g.latitude, g.longitude]));
      const mapSize = map.getSize();
      const padX = Math.max(8, Math.round(mapSize.x * 0.05));
      const padY = Math.max(8, Math.round(mapSize.y * 0.05));

      map.fitBounds(bounds, {
        paddingTopLeft: [padX, padY],
        paddingBottomRight: [padX, padY],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [groups, map]);

  return null;
};

// Map Controller for Flying / Repositioning to Selected Checkpoint/Location
const MapController: React.FC<{
  groups: LocationGroup[];
  activeCheckpointId?: string;
}> = ({ groups, activeCheckpointId }) => {
  const map = useMap();

  useEffect(() => {
    if (activeCheckpointId) {
      const activeGroup = groups.find((g) =>
        g.checkpoints.some((cp) => cp.id === activeCheckpointId)
      );
      if (activeGroup) {
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom, 13);
        map.flyTo([activeGroup.latitude, activeGroup.longitude], targetZoom, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
      }
    }
  }, [activeCheckpointId, groups, map]);

  return null;
};

// Generate Leaflet divIcon for a LocationGroup
const createLocationGroupMarkerIcon = (
  group: LocationGroup,
  isLastGroup: boolean,
  isSelected: boolean
) => {
  let iconEmoji = '📍';
  let badgeColor = 'bg-slate-700 text-white border-slate-600';

  if (group.facilityType === 'origin') {
    iconEmoji = '🏭';
    badgeColor = 'bg-slate-800 text-slate-200 border-slate-600';
  } else if (group.facilityType === 'sorting_hub') {
    iconEmoji = '📦';
    badgeColor = 'bg-purple-600 text-white border-purple-400';
  } else if (group.checkpoints.some((cp) => cp.status === 'delivered')) {
    iconEmoji = '🏠';
    badgeColor = 'bg-emerald-500 text-white border-emerald-300';
  } else if (group.checkpoints.some((cp) => cp.status === 'out_for_delivery')) {
    iconEmoji = '🚚';
    badgeColor = 'bg-amber-500 text-white border-amber-300';
  } else if (isLastGroup) {
    iconEmoji = '📍';
    badgeColor = 'bg-indigo-600 text-white border-indigo-300';
  }

  const activeStyles = isSelected
    ? 'scale-125 border-indigo-400 shadow-indigo-500/80 shadow-2xl ring-4 ring-indigo-400/80 ring-offset-2 ring-offset-slate-950'
    : 'hover:scale-110';

  const countBadge =
    group.checkpoints.length > 1
      ? `<span class="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full border border-slate-950 shadow-md">
          ${group.checkpoints.length}
         </span>`
      : '';

  const html = `
    <div class="relative group flex items-center justify-center">
      ${
        isSelected || isLastGroup
          ? `<div class="absolute -inset-3 rounded-full bg-indigo-500/50 animate-ping"></div>`
          : ''
      }
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full ${badgeColor} shadow-lg border-2 font-bold text-sm transition-all duration-300 ${activeStyles}">
        <span>${iconEmoji}</span>
        ${countBadge}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: `custom-leaflet-marker ${isSelected ? 'z-[1000]' : ''}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
};

// Create floating Transit Time Badge Icon for line midpoints
const createTransitTimeIcon = (durationText: string) => {
  const html = `
    <div class="flex items-center transform -translate-x-3.5 -translate-y-3.5 group">
      <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-indigo-500/90 shadow-xl flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover:scale-110">
        <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
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
  const groups = groupCheckpointsByLocation(checkpoints);
  const polylineCoords: [number, number][] = groups.map((g) => [g.latitude, g.longitude]);
  const markerRefs = React.useRef<{ [key: string]: L.Marker | null }>({});

  // Automatically open popup for active location group marker
  useEffect(() => {
    if (activeCheckpointId) {
      const targetGroup = groups.find((g) =>
        g.checkpoints.some((cp) => cp.id === activeCheckpointId)
      );
      if (targetGroup && markerRefs.current[targetGroup.id]) {
        markerRefs.current[targetGroup.id]?.openPopup();
      }
    }
  }, [activeCheckpointId, groups]);

  // Calculate segment midpoints between distinct location groups
  const segments = [];
  for (let i = 0; i < groups.length - 1; i++) {
    const g1 = groups[i];
    const g2 = groups[i + 1];

    const midLat = (g1.latitude + g2.latitude) / 2;
    const midLng = (g1.longitude + g2.longitude) / 2;
    const durationText = calculateTransitDuration(
      g1.latestCheckpoint.timestamp,
      g2.checkpoints[0].timestamp
    );

    segments.push({
      id: `seg-${g1.id}-${g2.id}`,
      midLat,
      midLng,
      durationText,
      from: g1.city,
      to: g2.city,
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
          {groups.length} Location Pin{groups.length > 1 ? 's' : ''} ({checkpoints.length} Events)
        </span>
      </div>

      <MapContainer
        center={[polylineCoords[0]?.[0] || 39.8283, polylineCoords[0]?.[1] || -98.5795]}
        zoom={5}
        zoomSnap={0.25}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapBoundsFitter groups={groups} />

        <MapController groups={groups} activeCheckpointId={activeCheckpointId} />

        {/* Route Polylines connecting location hubs */}
        {polylineCoords.length > 1 && (
          <>
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: carrier.accentHex || '#6366f1',
                weight: 7,
                opacity: 0.4,
                lineCap: 'round',
              }}
            />
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

        {/* Transit Line Midpoint Labels */}
        {segments.map((seg) => (
          <Marker
            key={seg.id}
            position={[seg.midLat, seg.midLng]}
            icon={createTransitTimeIcon(seg.durationText)}
            interactive={false}
          />
        ))}

        {/* Grouped Location Markers */}
        {groups.map((group, idx) => {
          const isLastGroup = idx === groups.length - 1;
          const isSelected = group.checkpoints.some((cp) => cp.id === activeCheckpointId);
          const markerIcon = createLocationGroupMarkerIcon(group, isLastGroup, isSelected);

          return (
            <Marker
              key={group.id}
              position={[group.latitude, group.longitude]}
              icon={markerIcon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[group.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onSelectCheckpoint?.(group.latestCheckpoint.id),
              }}
            >
              {/* Permanent Label Badge */}
              <Tooltip
                permanent
                direction="top"
                offset={[0, -24]}
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
                    {group.city}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-mono text-[10px]">
                    {group.checkpoints.length} {group.checkpoints.length === 1 ? 'Step' : 'Steps'}
                  </span>
                </div>
              </Tooltip>

              <Popup className="custom-dark-popup">
                <div className="space-y-1.5 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-xs text-indigo-400 flex items-center gap-1">
                      📍 {group.city}{group.stateCountry ? `, ${group.stateCountry}` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                      {group.checkpoints.length} {group.checkpoints.length === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-0.5">
                    <h4 className="font-heading font-bold text-sm text-white">{group.latestCheckpoint.statusTitle}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{group.latestCheckpoint.timestamp}</p>
                    <p className="text-[11px] text-slate-300 leading-snug">{group.latestCheckpoint.details}</p>
                    {group.hasWeatherAlert && (
                      <div className="mt-1.5 p-1.5 rounded bg-amber-950/60 border border-amber-600/40 text-[10px] text-amber-300">
                        ⚠️ Weather warning logged at this location
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
