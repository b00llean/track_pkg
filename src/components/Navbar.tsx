import React from 'react';
import { Package, History, ShieldCheck, FilePlus, Settings, Globe } from 'lucide-react';


interface NavbarProps {
  savedCount: number;
  onOpenHistory: () => void;
  onOpenImportModal: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  savedCount,
  onOpenHistory,
  onOpenImportModal,
  onOpenSettings,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Package className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl tracking-tight text-white">
                Track<span className="text-indigo-400">Pkg</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe className="w-3 h-3 animate-pulse text-emerald-400" /> 17TRACK Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Geospatial Package Journey & Multi-Carrier Route Tracker
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          
          {/* Live API Status Badge */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
              hasApiKey
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/30 hover:bg-amber-900/40'
            }`}
            title="Configure 17TRACK Live API Settings"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Live API Active' : 'Set 17TRACK Key'}</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer hover:text-white"
            title="17TRACK API Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          {/* Import Text Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
            title="Import Raw Tracking Text"
          >
            <FilePlus className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Import Custom Text</span>
          </button>

          {/* History Drawer Trigger Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all hover:shadow-md cursor-pointer active:scale-95"
            title="Saved Package History"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Saved Packages</span>
            {savedCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm shadow-indigo-500/50 animate-pulse">
                {savedCount}
              </span>
            )}
          </button>

          {/* Carrier Verification Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>UPS • FedEx • USPS • DHL</span>
          </div>

        </div>
      </div>
    </header>
  );
};
