import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Key, Check } from 'lucide-react';
import { detectCarrier } from '../services/carrierDetector';
import { CarrierInfo } from '../types/tracking';
import { getApiSettings, saveApiSettings } from '../services/liveTrackingService';

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
  onKeyUpdated,
}) => {
  const [inputVal, setInputVal] = useState(activeTrackingNum);
  const [detectedCarrier, setDetectedCarrier] = useState<CarrierInfo>(detectCarrier(activeTrackingNum));
  const [apiSettings, setApiSettings] = useState(() => getApiSettings());
  const [keyInput, setKeyInput] = useState(apiSettings.apiKey || '');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const latest = getApiSettings();
    setApiSettings(latest);
    if (latest.apiKey) {
      setKeyInput(latest.apiKey);
    }
  }, []);

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

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      const updated = { ...apiSettings, apiKey: keyInput.trim(), mode: 'live' as const, provider: '17track' as const };
      saveApiSettings(updated);
      setApiSettings(updated);
      setKeySaved(true);
      if (onKeyUpdated) onKeyUpdated();
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 space-y-4">
      {/* Inline 17TRACK Key Prompt Banner if key is missing */}
      {!apiSettings.apiKey && (
        <form onSubmit={handleSaveKey} className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-100">17TRACK API Key (17token) Required for Live Tracking</p>
              <p className="text-xs text-amber-300/80">Enter your 17TRACK key to enable 100% live package tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your 17token key..."
              className="w-full sm:w-64 bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-amber-400/50 font-mono outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
            >
              {keySaved ? <Check className="w-4 h-4" /> : 'Save Key'}
            </button>
          </div>
        </form>
      )}

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
    </div>
  );
};
