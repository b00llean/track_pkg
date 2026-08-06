import React from 'react';
import {
  CheckCircle2,
  Truck,
  Package,
  Clock,
  AlertTriangle,
  Building2,
  Navigation,
} from 'lucide-react';
import { Checkpoint, StatusCategory } from '../types/tracking';

interface JourneyTimelineProps {
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  onSelectCheckpoint?: (id: string) => void;
}

const getStatusBadge = (status: StatusCategory) => {
  switch (status) {
    case 'delivered':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      };
    case 'out_for_delivery':
      return {
        icon: <Truck className="w-4 h-4 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      };
    case 'in_transit':
      return {
        icon: <Navigation className="w-4 h-4 text-indigo-400" />,
        bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      };
    case 'picked_up':
      return {
        icon: <Package className="w-4 h-4 text-purple-400" />,
        bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      };
    default:
      return {
        icon: <Clock className="w-4 h-4 text-slate-400" />,
        bg: 'bg-slate-800 border-slate-700 text-slate-400',
      };
  }
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  checkpoints,
  activeCheckpointId,
  onSelectCheckpoint,
}) => {
  // Sort checkpoints descending for history timeline view
  const reversedCheckpoints = [...checkpoints].reverse();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="font-heading font-bold text-base text-white">Journey Milestone Timeline</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
          {checkpoints.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-slate-800">
        {reversedCheckpoints.map((cp, idx) => {
          const isLatest = idx === 0;
          const isSelected = cp.id === activeCheckpointId;
          const badgeStyle = getStatusBadge(cp.status);

          return (
            <div
              key={cp.id}
              onClick={() => onSelectCheckpoint?.(cp.id)}
              className={`relative group p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              {/* Timeline Connector Bullet */}
              <div
                className={`absolute -left-[31px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isLatest
                    ? 'bg-indigo-500 border-indigo-300 shadow-md shadow-indigo-500/50 scale-110'
                    : 'bg-slate-900 border-slate-600 group-hover:border-indigo-400'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLatest ? 'bg-white' : 'bg-slate-500 group-hover:bg-indigo-400'
                  }`}
                />
              </div>

              {/* Checkpoint Item Content */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyle.bg}`}>
                      {badgeStyle.icon}
                      <span>{cp.statusTitle}</span>
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                        LATEST SCAN
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono flex-shrink-0">{cp.timestamp}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{cp.location}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pl-5">{cp.details}</p>

                {/* Weather impact warning card if present */}
                {cp.weatherAlert && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-200">
                        Weather Warning ({cp.weatherAlert.condition})
                      </span>
                      <p className="text-amber-300/80 text-[11px] mt-0.5">{cp.weatherAlert.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
