import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Calendar,
  Weight,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PackageData } from '../types/tracking';

interface PackageSummaryCardProps {
  packageData: PackageData;
  onSaveToHistory: () => void;
  isSaved: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const PackageSummaryCard: React.FC<PackageSummaryCardProps> = ({
  packageData,
  onSaveToHistory,
  isSaved,
  onRefresh,
  isRefreshing = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(packageData.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { carrier, trackingNumber, origin, destination, currentStatusTitle, estimatedDelivery, progressPercent, shippingService, weight, pieces, isFromCache } = packageData;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5 relative overflow-hidden">
      
      {/* Background Gradient Glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${carrier.color} opacity-10 blur-3xl pointer-events-none rounded-full`}></div>

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        
        {/* Carrier Badge & Number */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl font-bold text-sm border flex items-center gap-2 ${carrier.badgeBg} ${carrier.badgeText}`}>
            <span>{carrier.logoIcon}</span>
            <span>{carrier.name}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-white tracking-wider">
                {trackingNumber}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Copy tracking number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{shippingService}</span>
              {isFromCache ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
                  title="Results cached for 5 minutes to prevent redundant API queries. Click Refresh for fresh update."
                >
                  <Clock className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Cached (5m)</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-500/30"
                  title="Live carrier API result (cached for 5 minutes)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span>Live</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh live package tracking (bypasses 5m cache)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}

          <button
            onClick={onSaveToHistory}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Save Package
              </>
            )}
          </button>

          <a
            href={`${carrier.website}?tracknum=${trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Carrier Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Status, ETA, & Specs Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Status Title Box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Current Status</span>
          <h3 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
            <span>{currentStatusTitle}</span>
          </h3>
          <p className="text-xs text-slate-300 truncate">{packageData.statusMessage}</p>
        </div>

        {/* Estimated Delivery Box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Estimated Delivery Window
          </span>
          <h3 className="font-heading font-extrabold text-lg text-indigo-300">
            {estimatedDelivery}
          </h3>
          <span className="text-xs text-slate-400">On schedule for delivery</span>
        </div>

        {/* Specs & Info Box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Shipment Specs</span>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            {weight && (
              <span className="flex items-center gap-1.5 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Weight className="w-3.5 h-3.5 text-indigo-400" /> {weight}
              </span>
            )}
            {pieces && (
              <span className="flex items-center gap-1.5 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> {pieces} {pieces > 1 ? 'Pieces' : 'Piece'}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Journey Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">Transit Completion Progress</span>
          <span className="text-indigo-400 font-bold font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-1000 ease-out shadow-sm shadow-indigo-500/50"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Origin -> Destination Route Details */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        
        {/* Origin */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Shipped From</span>
            <p className="font-semibold text-white text-sm">{origin.city}{origin.stateCountry ? `, ${origin.stateCountry}` : ''}</p>
          </div>
        </div>

        {/* Route Arrow Indicator */}
        <div className="hidden sm:flex items-center gap-3 text-slate-600 flex-1 px-4 justify-center">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-700 via-indigo-500/50 to-emerald-500/50 rounded-full"></div>
          <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500/50 via-indigo-500/50 to-slate-700 rounded-full"></div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Destination</span>
            <p className="font-semibold text-white text-sm">{destination.city}{destination.stateCountry ? `, ${destination.stateCountry}` : ''}</p>
          </div>
        </div>

      </div>

    </div>
  );
};
