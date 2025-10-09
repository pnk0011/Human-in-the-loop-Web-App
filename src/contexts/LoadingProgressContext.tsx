import React, { useState, useEffect, useContext } from 'react';
import { LoadingProgress } from '../components/LoadingComponents';

interface LoadingProgressProviderProps {
  children: React.ReactNode;
}

interface LoadingProgressContextType {
  progress: number;
  setProgress: (progress: number) => void;
  resetProgress: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingProgressContext = React.createContext<LoadingProgressContextType | undefined>(undefined);

export function LoadingProgressProvider({ children }: LoadingProgressProviderProps) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const resetProgress = () => {
    setProgress(0);
    setIsLoading(false);
  };

  // Auto-increment progress when loading
  useEffect(() => {
    if (isLoading && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until manually completed
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoading, progress]);

  const value: LoadingProgressContextType = {
    progress,
    setProgress,
    resetProgress,
    isLoading,
    setIsLoading,
  };

  return (
    <LoadingProgressContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <LoadingProgress 
            progress={progress} 
            text="Loading application..." 
            className="h-1"
          />
        </div>
      )}
    </LoadingProgressContext.Provider>
  );
}

export function useLoadingProgress() {
  const context = useContext(LoadingProgressContext);
  if (context === undefined) {
    throw new Error('useLoadingProgress must be used within a LoadingProgressProvider');
  }
  return context;
}

