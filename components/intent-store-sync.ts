import { useEffect, useRef } from 'react';
import { useIntentStore } from './intent-store';

// Singleton to track if sync is already running
let isSyncActive = false;

export function useIntentSync() {
  const fetchIntents = useIntentStore((state) => state.fetchIntents);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Only start sync if not already running
    if (isSyncActive) {
      return;
    }
    
    isSyncActive = true;
    
    // Initial fetch
    fetchIntents();

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(async () => {
      fetchIntents();
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        isSyncActive = false;
      }
    };
  }, [fetchIntents]);
}