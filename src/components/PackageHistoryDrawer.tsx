import React from 'react';
import { X, History, Trash2, ArrowRight, Truck } from 'lucide-react';
import { SavedPackage } from '../types/tracking';
import { CARRIERS } from '../services/carrierDetector';

interface PackageHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPackages: SavedPackage[];
  onSelectPackage: (trackingNumber: string) => void;
  onRemovePackage: (trackingNumber: string) => void;
  onClearAll: () => void;
}

export const PackageHistoryDrawer: React.FC<PackageHistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedPackages,
  onSelectPackage,
  onRemovePackage,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Saved Package History</h3>
              <p className="text-xs text-slate-400">Track multiple packages in one workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Package Cards List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {savedPackages.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-300">No Saved Packages Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Track a package and click "Save Package" to pin it to your active history list.
              </p>
            </div>
          ) : (
            savedPackages.map((pkg) => {
              const carrier = CARRIERS[pkg.carrierId] || CARRIERS.unknown;

              return (
                <div
                  key={pkg.trackingNumber}
                  className="group relative p-4 rounded-xl glass-card hover:border-indigo-500/50 transition-all space-y-2 cursor-pointer"
                  onClick={() => {
                    onSelectPackage(pkg.trackingNumber);
                    onClose();
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${carrier.badgeBg} ${carrier.badgeText}`}>
                      {carrier.name}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePackage(pkg.trackingNumber);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Remove package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                      {pkg.trackingNumber}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{pkg.originCity} → {pkg.destCity}</span>
                    <span className="text-[10px] text-slate-500">{pkg.lastChecked}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {savedPackages.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              {savedPackages.length} package{savedPackages.length > 1 ? 's' : ''} stored locally
            </span>
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
