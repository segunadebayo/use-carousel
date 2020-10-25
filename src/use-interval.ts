import { useEffect, useRef } from 'react';

/**
 * React hook for native JS `setInterval`, used for the autoplay
 * functionality in the carousel
 */
function useInterval(callback: () => void, delay: number, clear: boolean) {
  const savedCallback = useRef<any>();
  const intervalRef = useRef<any>();

  // Remember the latest function.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (clear) return;
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      intervalRef.current = setInterval(tick, delay);
      return () => clearInterval(intervalRef.current);
    }
  }, [delay, clear]);

  useEffect(() => {
    if (!clear || !intervalRef.current) return;
    clearInterval(intervalRef.current);
  }, [clear]);
}

export default useInterval;
