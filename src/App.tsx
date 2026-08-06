import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TrackingSearch } from './components/TrackingSearch';
import { PackageSummaryCard } from './components/PackageSummaryCard';
import { InteractiveMap } from './components/InteractiveMap';
import { JourneyTimeline } from './components/JourneyTimeline';
import { PackageHistoryDrawer } from './components/PackageHistoryDrawer';
import { ImportTrackingModal } from './components/ImportTrackingModal';
import { fetchPackageTracking } from './services/trackingService';
import { PackageData, SavedPackage } from './types/tracking';
import { AlertCircle, MapPin, RefreshCw, Compass } from 'lucide-react';

const STORAGE_KEY = 'track_pkg_saved_history_v1';

export const App: React.FC = () => {
  const [activeTrackingNum, setActiveTrackingNum] = useState<string>('875278203409');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | undefined>();

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
  const handleTrack = async (num: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setActiveTrackingNum(num);
    setActiveCheckpointId(undefined);

    try {
      const data = await fetchPackageTracking(num);
      setPackageData(data);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setErrorMsg('Unable to retrieve tracking details for this carrier number. Please verify the format.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleTrack(activeTrackingNum);
  }, []);

  const toggleSavePackage = () => {
    if (!packageData) return;

    const exists = savedPackages.some((p) => p.trackingNumber === packageData.trackingNumber);
    if (exists) {
      setSavedPackages(savedPackages.filter((p) => p.trackingNumber !== packageData.trackingNumber));
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
      setSavedPackages([newEntry, ...savedPackages]);
    }
  };

  const isCurrentPackageSaved = Boolean(
    packageData && savedPackages.some((p) => p.trackingNumber === packageData.trackingNumber)
  );

  const handleImportComplete = (customData: PackageData) => {
    setPackageData(customData);
    setActiveTrackingNum(customData.trackingNumber);
    setActiveCheckpointId(undefined);
  };

  const handleSelectCheckpoint = (id: string) => {
    setActiveCheckpointId((prev) => (prev === id ? undefined : id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        savedCount={savedPackages.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
      />

      {/* Main Content Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        
        {/* Search Hero Header */}
        <div className="text-center space-y-2 mb-4">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Geospatial Multi-Carrier Package Journey
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Input any FedEx, UPS, USPS, or DHL tracking number to view an interactive map route, real-time weather disruption overlays, and milestone timeline.
          </p>
        </div>

        {/* Tracking Search Input Form */}
        <TrackingSearch
          onSearch={handleTrack}
          isLoading={isLoading}
          activeTrackingNum={activeTrackingNum}
        />

        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-rose-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => handleTrack(activeTrackingNum)}
              className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Package Journey Visualizer (`track_pkg`) • Multi-Carrier OpenStreetMap & Leaflet Visualizer</p>
      </footer>
    </div>
  );
};
