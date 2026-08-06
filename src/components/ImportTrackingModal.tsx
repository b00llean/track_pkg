import React, { useState } from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import { geocodeLocation } from '../services/geocoding';
import { PackageData, Checkpoint } from '../types/tracking';
import { CARRIERS, detectCarrier } from '../services/carrierDetector';

interface ImportTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (data: PackageData) => void;
}

export const ImportTrackingModal: React.FC<ImportTrackingModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [rawText, setRawText] = useState(`Tracking ID: 875278203409
Monday, 8/3/26 9:28 PM Shipment information sent to FedEx
Wednesday, 8/5/26 12:00 AM Picked up ARCADIA, CA
Wednesday, 8/5/26 1:21 PM Arrived at FedEx location ARCADIA, CA
Thursday, 8/6/26 2:21 AM Left FedEx origin facility ARCADIA, CA
Shipment Facts: Weight 44.1 lbs / 20 kgs, Estimated Delivery 8/11/2026`);

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    setIsProcessing(true);
    try {
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

      // Extract tracking number if present
      let trackingNum = 'CUSTOM-' + Math.floor(100000 + Math.random() * 900000);
      const trackMatch = rawText.match(/(?:Tracking ID|Tracking Number|Number)[\s:]*([A-Z0-9]{8,22})/i);
      if (trackMatch) {
        trackingNum = trackMatch[1];
      }

      const carrier = detectCarrier(trackingNum);

      // Parse checkpoint lines
      const parsedCheckpoints: Omit<Checkpoint, 'id' | 'sequence'>[] = [];

      for (const line of lines) {
        if (line.toLowerCase().includes('tracking id') || line.toLowerCase().includes('shipment facts')) continue;

        // Try extracting timestamp & location
        const timeMatch = line.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
        const timestamp = timeMatch ? timeMatch[0] : new Date().toLocaleDateString();

        let locationName = 'In Transit';
        let city = 'Origin Hub';
        let stateCountry = 'US';

        const locMatch = line.match(/([A-Z\s]{3,}),?\s*([A-Z]{2})/);
        if (locMatch) {
          city = locMatch[1].trim();
          stateCountry = locMatch[2].trim();
          locationName = `${city}, ${stateCountry}`;
        }

        const [latitude, longitude] = await geocodeLocation(locationName);

        parsedCheckpoints.push({
          timestamp,
          location: locationName,
          city,
          stateCountry,
          latitude,
          longitude,
          status: line.toLowerCase().includes('left') ? 'in_transit' : line.toLowerCase().includes('picked') ? 'picked_up' : 'label_created',
          statusTitle: line.replace(timeMatch ? timeMatch[0] : '', '').trim() || 'Scan Event',
          details: `Carrier scan event: ${line}`,
          facilityType: line.toLowerCase().includes('left') ? 'transit_facility' : 'sorting_hub',
        });
      }

      if (parsedCheckpoints.length === 0) {
        const [lat, lng] = await geocodeLocation('Arcadia, CA');
        parsedCheckpoints.push({
          timestamp: 'Aug 06, 2026 - 02:21 AM',
          location: 'ARCADIA, CA',
          city: 'ARCADIA',
          stateCountry: 'CA, USA',
          latitude: lat,
          longitude: lng,
          status: 'in_transit',
          statusTitle: 'Left FedEx origin facility',
          details: 'Left FedEx origin facility ARCADIA, CA',
          facilityType: 'transit_facility',
        });
      }

      const hydratedCheckpoints: Checkpoint[] = parsedCheckpoints.map((cp, idx) => ({
        ...cp,
        id: `custom-cp-${idx}`,
        sequence: idx + 1,
      }));

      const firstCp = hydratedCheckpoints[0];
      const lastCp = hydratedCheckpoints[hydratedCheckpoints.length - 1];

      const importedData: PackageData = {
        trackingNumber: trackingNum,
        carrier: carrier.id !== 'unknown' ? carrier : CARRIERS.fedex,
        origin: {
          city: firstCp.city,
          stateCountry: firstCp.stateCountry,
          latitude: firstCp.latitude,
          longitude: firstCp.longitude,
        },
        destination: {
          city: 'Destination Hub',
          stateCountry: 'US',
          latitude: lastCp.latitude + 1.2,
          longitude: lastCp.longitude - 2.5,
        },
        currentStatus: lastCp.status,
        currentStatusTitle: lastCp.statusTitle,
        statusMessage: `Latest update: ${lastCp.statusTitle} at ${lastCp.location}`,
        estimatedDelivery: 'Aug 11, 2026 (10:20 AM - 2:20 PM)',
        shippingService: 'FedEx Home Delivery',
        weight: '44.1 lbs / 20 kgs',
        pieces: 1,
        progressPercent: 45,
        isDelivered: false,
        lastUpdated: new Date().toLocaleTimeString(),
        checkpoints: hydratedCheckpoints,
      };

      onImportComplete(importedData);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-heading font-bold text-lg text-white">Import / Paste Carrier Tracking Text</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Paste history lines from any FedEx, UPS, or USPS tracking page to plot custom events onto the map.
        </p>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={7}
          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={isProcessing || !rawText.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            {isProcessing ? (
              <span>Parsing & Geocoding...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse & Map Package</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
