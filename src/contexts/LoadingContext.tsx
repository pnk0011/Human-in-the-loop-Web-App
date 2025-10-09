import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LoadingOverlay } from './LoadingComponents';

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>, text?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoading = useCallback((text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    text = 'Loading...'
  ): Promise<T> => {
    try {
      showLoading(text);
      const result = await asyncFn();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const value: LoadingContextType = {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      <LoadingOverlay loading={isLoading} text={loadingText}>
        {children}
      </LoadingOverlay>
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}

// Higher-order component for wrapping components with global loading
export function withGlobalLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function GlobalLoadingWrapper(props: P) {
    return (
      <LoadingProvider>
        <Component {...props} />
      </LoadingProvider>
    );
  };
}
