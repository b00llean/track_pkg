import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Truck,
  Package,
  Clock,
  AlertTriangle,
  Building2,
  Navigation,
  ChevronDown,
  ChevronUp,
  MapPin,
  ArrowDown,
} from 'lucide-react';
import { Checkpoint, StatusCategory } from '../types/tracking';
import { groupCheckpointsByLocation } from '../utils/grouping';
import { calculateTransitDuration } from '../utils/dateUtils';

interface JourneyTimelineProps {
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  onSelectCheckpoint?: (id: string) => void;
}

const getStatusBadge = (status: StatusCategory) => {
  switch (status) {
    case 'delivered':
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      };
    case 'out_for_delivery':
      return {
        icon: <Truck className="w-3.5 h-3.5 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      };
    case 'in_transit':
      return {
        icon: <Navigation className="w-3.5 h-3.5 text-indigo-400" />,
        bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      };
    case 'picked_up':
      return {
        icon: <Package className="w-3.5 h-3.5 text-purple-400" />,
        bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      };
    default:
      return {
        icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
        bg: 'bg-slate-800 border-slate-700 text-slate-400',
      };
  }
};



export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  checkpoints,
  activeCheckpointId,
  onSelectCheckpoint,
}) => {
  // Group checkpoints by location
  const locationGroups = React.useMemo(() => groupCheckpointsByLocation(checkpoints), [checkpoints]);
  // Display location groups descending (latest location group first at top)
  const reversedGroups = React.useMemo(() => [...locationGroups].reverse(), [locationGroups]);

  // Track expanded state for each location group (default: ALL COLLAPSED)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group if activeCheckpointId changes or matches
  useEffect(() => {
    if (activeCheckpointId) {
      const activeGroup = locationGroups.find((g) =>
        g.checkpoints.some((cp) => cp.id === activeCheckpointId)
      );
      if (activeGroup) {
        setExpandedGroups((prev) => {
          if (prev[activeGroup.id]) return prev;
          return {
            ...prev,
            [activeGroup.id]: true,
          };
        });
      }
    }
  }, [activeCheckpointId, locationGroups]);

  const toggleGroupExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    locationGroups.forEach((g) => {
      all[g.id] = true;
    });
    setExpandedGroups(all);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  const hasAnyExpanded = Object.values(expandedGroups).some(Boolean);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="font-heading font-bold text-base text-white">Journey Milestone Timeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={hasAnyExpanded ? collapseAll : expandAll}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {hasAnyExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {locationGroups.length} Location{locationGroups.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Timeline Group List with Connectors */}
      <div className="space-y-1">
        {reversedGroups.map((group, groupIdx) => {
          const isLatestGroup = groupIdx === 0;
          const isExpanded = Boolean(expandedGroups[group.id]);
          const hasActiveStep = group.checkpoints.some((cp) => cp.id === activeCheckpointId);
          // Show steps in reverse within group so latest event is at top
          const reversedCheckpoints = [...group.checkpoints].reverse();

          return (
            <React.Fragment key={group.id}>
              {/* Location Group Bubble Container */}
              <div
                className={`rounded-xl border transition-all overflow-hidden ${
                  hasActiveStep
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Location Group Header Banner */}
                <div
                  onClick={(e) => {
                    // Toggle expansion and select the group's latest checkpoint
                    toggleGroupExpand(group.id, e);
                    if (onSelectCheckpoint && group.latestCheckpoint) {
                      onSelectCheckpoint(group.latestCheckpoint.id);
                    }
                  }}
                  className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-850 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-xs shadow-md shrink-0 ${
                        isLatestGroup
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-white">
                          {group.city}{group.stateCountry ? `, ${group.stateCountry}` : ''}
                        </h4>
                        {isLatestGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[220px] sm:max-w-xs">{group.latestCheckpoint.statusTitle}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono font-medium border border-slate-700/80">
                      {group.checkpoints.length} {group.checkpoints.length === 1 ? 'Event' : 'Events'}
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isExpanded ? 'Collapse location events' : 'Expand location events'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Steps Details Container */}
                {isExpanded && (
                  <div className="p-3.5 space-y-3 border-t border-slate-800/80 bg-slate-950/40 relative pl-8 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                    {reversedCheckpoints.map((cp, stepIdx) => {
                      const isLatestStepInGroup = stepIdx === 0 && isLatestGroup;
                      const isSelected = cp.id === activeCheckpointId;
                      const badgeStyle = getStatusBadge(cp.status);

                      return (
                        <div
                          key={cp.id}
                          onClick={() => onSelectCheckpoint?.(cp.id)}
                          className={`relative group p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                              : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                          }`}
                        >
                          {/* Timeline Bullet Connector */}
                          <div
                            className={`absolute -left-[22px] top-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isLatestStepInGroup
                                ? 'bg-indigo-500 border-indigo-300 shadow-sm scale-110'
                                : isSelected
                                ? 'bg-indigo-400 border-indigo-200'
                                : 'bg-slate-900 border-slate-600 group-hover:border-indigo-400'
                            }`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${
                                isLatestStepInGroup || isSelected ? 'bg-white' : 'bg-slate-500 group-hover:bg-indigo-400'
                              }`}
                            />
                          </div>

                          {/* Step Details */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyle.bg}`}>
                                {badgeStyle.icon}
                                <span>{cp.statusTitle}</span>
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                                {cp.timestamp}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed pt-0.5 font-normal">
                              {cp.details}
                            </p>

                            {cp.weatherAlert && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-amber-200">
                                    Weather Alert: {cp.weatherAlert.condition}
                                  </span>
                                  <p className="text-amber-300/80 text-[11px] mt-0.5">
                                    {cp.weatherAlert.description}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inter-Location Transit Connector with Duration Label */}
              {groupIdx < reversedGroups.length - 1 && (
                <div className="relative py-2.5 flex items-center justify-center">
                  {/* Vertical Connector Line */}
                  <div className="absolute inset-y-0 left-8 w-0.5 bg-gradient-to-b from-indigo-500/60 via-purple-500/40 to-slate-800 -z-0"></div>

                  {/* Transit Duration Label Badge */}
                  <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-indigo-500/40 text-[11px] font-mono font-bold text-indigo-300 shadow-xl backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {calculateTransitDuration(
                        reversedGroups[groupIdx + 1],
                        group
                      )}
                    </span>
                    <ArrowDown className="w-3 h-3 text-indigo-400 shrink-0" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
