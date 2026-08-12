import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { detectCarrier } from '../services/carrierDetector';
import { CarrierInfo } from '../types/tracking';

interface TrackingSearchProps {
  onSearch: (trackingNumber: string) => void;
  isLoading: boolean;
  activeTrackingNum?: string;
  onKeyUpdated?: () => void;
}

export const TrackingSearch: React.FC<TrackingSearchProps> = ({
  onSearch,
  isLoading,
  activeTrackingNum = '',
}) => {
  const [inputVal, setInputVal] = useState(activeTrackingNum);
  const [detectedCarrier, setDetectedCarrier] = useState<CarrierInfo>(detectCarrier(activeTrackingNum));

  useEffect(() => {
    setDetectedCarrier(detectCarrier(inputVal));
  }, [inputVal]);

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

      {/* Quick Sample Tracking Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="text-slate-500 font-medium">Quick Demo Samples:</span>
        <button
          type="button"
          onClick={() => {
            setInputVal('875278203409');
            onSearch('875278203409');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer font-mono text-[11px]"
        >
          📦 FedEx (875278203409)
        </button>
        <button
          type="button"
          onClick={() => {
            setInputVal('1Z9999999999999999');
            onSearch('1Z9999999999999999');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer font-mono text-[11px]"
        >
          🚚 UPS Sample
        </button>
        <button
          type="button"
          onClick={() => {
            setInputVal('9400100000000000000000');
            onSearch('9400100000000000000000');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer font-mono text-[11px]"
        >
          📬 USPS Sample
        </button>
      </div>
    </div>
  );
};
