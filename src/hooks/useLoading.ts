import { useState, useCallback, useRef, useEffect } from 'react';

interface UseLoadingOptions {
  initialLoading?: boolean;
  delay?: number;
  timeout?: number;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { initialLoading = false, delay = 0, timeout } = options;
  const [loading, setLoading] = useState(initialLoading);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setLoading(true);
      }, delay);
    } else {
      setLoading(true);
    }

    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, timeout);
    }
  }, [delay, timeout]);

  const stopLoading = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(false);
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading();
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    };
  }, []);

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      setLoading(key, true);
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}

// Hook for debounced loading
export function useDebouncedLoading(delay: number = 300) {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setDebouncedLoading = useCallback((isLoading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      setLoading(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, delay);
    }
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    loading,
    setDebouncedLoading,
  };
}
