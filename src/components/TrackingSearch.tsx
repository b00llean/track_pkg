import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowRight, History } from 'lucide-react';
import { detectCarrier } from '../services/carrierDetector';
import { CarrierInfo, RecentTrackedPackage } from '../types/tracking';

interface TrackingSearchProps {
  onSearch: (trackingNumber: string) => void;
  isLoading: boolean;
  activeTrackingNum?: string;
  recentPackages?: RecentTrackedPackage[];
  onKeyUpdated?: () => void;
}

export const TrackingSearch: React.FC<TrackingSearchProps> = ({
  onSearch,
  isLoading,
  activeTrackingNum = '',
  recentPackages = [],
}) => {
  const [inputVal, setInputVal] = useState(activeTrackingNum);
  const [detectedCarrier, setDetectedCarrier] = useState<CarrierInfo>(detectCarrier(activeTrackingNum));

  useEffect(() => {
    setInputVal(activeTrackingNum);
  }, [activeTrackingNum]);

  useEffect(() => {
    setDetectedCarrier(detectCarrier(inputVal));
  }, [inputVal]);

  // Take the 3 most recent user searches (sorted most recent at index 0 on left)
  const displayPackages = useMemo(() => {
    return (recentPackages || []).slice(0, 3);
  }, [recentPackages]);

  // Handle search submit, trimming whitespace and guarding against double submissions while loading
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = inputVal.trim();
    if (cleanNumber && !isLoading) {
      onSearch(cleanNumber);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 space-y-3">
      {/* Main Search Input Form */}
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glowing Input Frame */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
          {/* Input field with icon */}
          <div className="relative flex-1 w-full flex items-center pl-4">
            <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter FedEx, UPS, USPS or DHL live tracking number..."
              className="w-full bg-transparent py-3.5 pr-4 text-white text-base placeholder-slate-500 focus:outline-none font-mono"
            />

            {/* Carrier Detection Badge inside input */}
            {inputVal.trim().length > 3 && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 mr-2 rounded-full text-xs font-semibold border transition-all ${detectedCarrier.badgeBg} ${detectedCarrier.badgeText}`}>
                <span>{detectedCarrier.logoIcon}</span>
                <span>{detectedCarrier.name}</span>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="w-full md:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Querying 17TRACK Live API...</span>
              </>
            ) : (
              <>
                <span>Live Track Package</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Recently Tracked Packages (only shown if user has recent searches) */}
      {displayPackages.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-1">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recently Tracked:</span>
          </div>
          {displayPackages.map((pkg) => {
            const isActive =
              activeTrackingNum.trim().toUpperCase() === pkg.trackingNumber.trim().toUpperCase();
            return (
              <button
                key={pkg.trackingNumber}
                type="button"
                onClick={() => {
                  setInputVal(pkg.trackingNumber);
                  onSearch(pkg.trackingNumber);
                }}
                title={`Track ${pkg.carrierName} package ${pkg.trackingNumber}`}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-indigo-950/80 border-indigo-500/70 text-indigo-200 shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span className="text-sm">{pkg.logoIcon}</span>
                <span className="font-semibold text-slate-200">{pkg.carrierName}</span>
                <span className="text-slate-600">·</span>
                <span className="hidden sm:inline font-mono">{pkg.trackingNumber}</span>
                <span className="sm:hidden font-mono">
                  {pkg.trackingNumber.length > 12
                    ? `${pkg.trackingNumber.slice(0, 4)}...${pkg.trackingNumber.slice(-4)}`
                    : pkg.trackingNumber}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
