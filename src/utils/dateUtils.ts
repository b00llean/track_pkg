/**
 * Utility functions for date parsing and transit duration calculation across map and timeline components.
 */

export function calculateTransitDuration(ts1: string, ts2: string): string {
  try {
    const parseTs = (s: string) => {
      if (!s) return null;
      const cleaned = s.replace('-', '').trim();
      const d = new Date(cleaned);
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    const ms1 = parseTs(ts1);
    const ms2 = parseTs(ts2);

    if (ms1 && ms2) {
      const diffMs = Math.abs(ms2 - ms1);
      const totalMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const days = Math.floor(hours / 24);

      if (days > 0) {
        const remHours = hours % 24;
        return remHours > 0 ? `${days}d ${remHours}h transit` : `${days}d transit`;
      } else if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m transit`;
      } else if (hours > 0) {
        return `${hours}h transit`;
      } else if (mins > 0) {
        return `${mins}m transit`;
      }
    }
  } catch (e) {
    console.warn('Duration parse error:', e);
  }
  return 'In transit';
}
