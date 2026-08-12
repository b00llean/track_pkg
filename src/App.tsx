import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TrackingSearch } from './components/TrackingSearch';
import { PackageSummaryCard } from './components/PackageSummaryCard';
import { InteractiveMap } from './components/InteractiveMap';
import { JourneyTimeline } from './components/JourneyTimeline';
import { PackageHistoryDrawer } from './components/PackageHistoryDrawer';
import { ImportTrackingModal } from './components/ImportTrackingModal';
import { SettingsModal } from './components/SettingsModal';
import { fetchPackageTracking } from './services/trackingService';
import { getApiSettings, saveApiSettings } from './services/liveTrackingService';
import { PackageData, SavedPackage, TrackingApiSettings } from './types/tracking';
import { AlertCircle, MapPin, RefreshCw, Compass, ExternalLink, FilePlus } from 'lucide-react';

const STORAGE_KEY = 'track_pkg_saved_history_v1';

export const App: React.FC = () => {
  const [activeTrackingNum, setActiveTrackingNum] = useState<string>('875278203409');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | undefined>();

  // API Settings State
  const [apiSettings, setApiSettings] = useState<TrackingApiSettings>(() => getApiSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);


  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPackages));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [savedPackages]);

  // Load package data on initial mount or when tracking number changes
  const handleTrack = useCallback(async (num: string) => {
    if (!num.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setActiveTrackingNum(num);
    setActiveCheckpointId(undefined);

    try {
      const data = await fetchPackageTracking(num);
      setPackageData(data);
    } catch (err: any) {
      console.error('Tracking fetch error:', err);
      setErrorMsg(err.message || 'Unable to retrieve tracking details for this carrier number.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiSettings.apiKey && activeTrackingNum) {
      handleTrack(activeTrackingNum);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleSaveSettings = useCallback((newSettings: TrackingApiSettings) => {
    saveApiSettings(newSettings);
    setApiSettings(newSettings);
    if (newSettings.apiKey && activeTrackingNum) {
      handleTrack(activeTrackingNum);
    }
  }, [activeTrackingNum, handleTrack]);

  const toggleSavePackage = useCallback(() => {
    if (!packageData) return;

    setSavedPackages((prev) => {
      const exists = prev.some((p) => p.trackingNumber === packageData.trackingNumber);
      if (exists) {
        return prev.filter((p) => p.trackingNumber !== packageData.trackingNumber);
      } else {
        const newEntry: SavedPackage = {
          trackingNumber: packageData.trackingNumber,
          carrierId: packageData.carrier.id,
          carrierName: packageData.carrier.name,
          statusTitle: packageData.currentStatusTitle,
          originCity: packageData.origin.city,
          destCity: packageData.destination.city,
          lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDelivered: packageData.isDelivered,
        };
        return [newEntry, ...prev];
      }
    });
  }, [packageData]);

  const isCurrentPackageSaved = Boolean(
    packageData && savedPackages.some((p) => p.trackingNumber === packageData.trackingNumber)
  );

  const handleImportComplete = useCallback((customData: PackageData) => {
    setPackageData(customData);
    setActiveTrackingNum(customData.trackingNumber);
    setActiveCheckpointId(undefined);
  }, []);

  const handleSelectCheckpoint = useCallback((id: string) => {
    setActiveCheckpointId((prev) => (prev === id ? undefined : id));
  }, []);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        savedCount={savedPackages.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiSettings.apiKey)}
      />

      {/* Main Content Workspace Container */}
      <main className="flex-1 max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        
        {/* Compact Search Hero Header */}
        <div className="text-center space-y-1 mb-3">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Geospatial Multi-Carrier Package Journey
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Track FedEx, UPS, USPS & DHL live packages with real-time geospatial Leaflet maps and checkpoint timelines.
          </p>
        </div>

        {/* Tracking Search Input Form */}
        <TrackingSearch
          onSearch={handleTrack}
          isLoading={isLoading}
          activeTrackingNum={activeTrackingNum}
          onKeyUpdated={() => {
            const updated = getApiSettings();
            setApiSettings(updated);
            if (activeTrackingNum) handleTrack(activeTrackingNum);
          }}
        />


        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-sm space-y-3 shadow-2xl animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-rose-100">Tracking Query Status</h4>
                <p className="text-xs text-rose-200/90 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-rose-900/60 text-xs">
              {activeTrackingNum && (
                <a
                  href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${activeTrackingNum}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-200 border border-rose-500/30 transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <span>Track on USPS Official Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Import Tracking Text</span>
              </button>
              <button
                onClick={() => handleTrack(activeTrackingNum)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Loaded Package Visualization Layout */}
        {packageData && !isLoading && (
          <div className="space-y-6">
            
            {/* Top Package Summary Card */}
            <PackageSummaryCard
              packageData={packageData}
              onSaveToHistory={toggleSavePackage}
              isSaved={isCurrentPackageSaved}
            />

            {/* Split Grid: Interactive Map + Milestone Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Leaflet Geospatial Interactive Map (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Geospatial Route Map
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Click markers to view details</span>
                </div>
                <InteractiveMap
                  packageData={packageData}
                  activeCheckpointId={activeCheckpointId}
                  onSelectCheckpoint={handleSelectCheckpoint}
                />
              </div>

              {/* Right Side: Step-by-Step Timeline (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <JourneyTimeline
                  checkpoints={packageData.checkpoints}
                  activeCheckpointId={activeCheckpointId}
                  onSelectCheckpoint={handleSelectCheckpoint}
                />
              </div>

            </div>

          </div>
        )}

        {/* Loading Spinner Skeleton state */}
        {isLoading && (
          <div className="py-24 text-center space-y-4">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <Compass className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Retrieving checkpoints & plotting geospatial map coordinates...
            </p>
          </div>
        )}

      </main>

      {/* History Drawer Modal */}
      <PackageHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedPackages={savedPackages}
        onSelectPackage={(num) => handleTrack(num)}
        onRemovePackage={(num) =>
          setSavedPackages(savedPackages.filter((p) => p.trackingNumber !== num))
        }
        onClearAll={() => setSavedPackages([])}
      />

      {/* Custom Text Import Modal */}
      <ImportTrackingModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* API & Carrier Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={apiSettings}
        onSaveSettings={handleSaveSettings}
      />


      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Package Journey Visualizer (`track_pkg`) • Multi-Carrier OpenStreetMap & Leaflet Visualizer</p>
      </footer>
    </div>
  );
};
