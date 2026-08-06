import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { detectCarrier, SAMPLE_TRACKING_NUMBERS, SampleTracking } from '../services/carrierDetector';
import { CarrierInfo } from '../types/tracking';

interface TrackingSearchProps {
  onSearch: (trackingNumber: string) => void;
  isLoading: boolean;
  activeTrackingNum?: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleSampleClick = (sample: SampleTracking) => {
    setInputVal(sample.trackingNumber);
    onSearch(sample.trackingNumber);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <form onSubmit={handleSubmit} className="relative group">
        
        {/* Glowing Input Frame */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>

        <div className="relative flex flex-col md:flex-row items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
          
          {/* Input field with icon */}
          <div className="relative flex-1 w-full flex items-center pl-4">
            <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter tracking number (e.g. 1Z9999999999999999, 781234567890, 9400...)"
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
            className="w-full md:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Fetching Route...</span>
              </>
            ) : (
              <>
                <span>Track Journey</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Test Samples */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Presets:
        </span>
        {SAMPLE_TRACKING_NUMBERS.map((sample) => (
          <button
            key={sample.trackingNumber}
            onClick={() => handleSampleClick(sample)}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/40 transition-all cursor-pointer"
            title={sample.description}
          >
            <span>{sample.label}</span>
            <CheckCircle2 className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
