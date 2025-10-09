import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const LoadingSpinner = React.memo(function LoadingSpinner({ 
  size = 'md', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#0292DC]`} />
      {text && (
        <span className="text-[#80989A] dark:text-[#a0a0a0] text-sm">
          {text}
        </span>
      )}
    </div>
  );
});

interface LoadingPageProps {
  text?: string;
}

export const LoadingPage = React.memo(function LoadingPage({ 
  text = 'Loading...' 
}: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
});

interface LoadingCardProps {
  text?: string;
  className?: string;
}

export const LoadingCard = React.memo(function LoadingCard({ 
  text = 'Loading...',
  className = ''
}: LoadingCardProps) {
  return (
    <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm border border-[#E5E7EB] dark:border-[#3a3a3a] p-6 ${className}`}>
      <LoadingSpinner text={text} />
    </div>
  );
});

// Skeleton loading components
export const LoadingDashboardStats = React.memo(function LoadingDashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
});

export const LoadingTable = React.memo(function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Table header skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        {/* Table rows skeleton */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </Card>
  );
});

export const LoadingForm = React.memo(function LoadingForm() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </Card>
  );
});

export const LoadingChart = React.memo(function LoadingChart() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </Card>
  );
});

// Button loading state
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const LoadingButton = React.memo(function LoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  onClick
}: LoadingButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
        loading || disabled 
          ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
          : 'bg-[#0292DC] hover:bg-[#012F66] text-white'
      } ${className}`}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

// Overlay loader for modals/dialogs
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
}

export const LoadingOverlay = React.memo(function LoadingOverlay({
  loading,
  children,
  text = 'Loading...'
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#2a2a2a]/80 flex items-center justify-center z-50 rounded-lg">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
});

// Progress bar loader
interface LoadingProgressProps {
  progress: number;
  text?: string;
  className?: string;
}

export const LoadingProgress = React.memo(function LoadingProgress({
  progress,
  text,
  className = ''
}: LoadingProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {text && (
        <div className="flex justify-between text-sm text-[#80989A] dark:text-[#a0a0a0] mb-2">
          <span>{text}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-[#0292DC] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
});

// Inline loading state for buttons
export const LoadingInline = React.memo(function LoadingInline({ 
  loading, 
  children 
}: { 
  loading: boolean; 
  children: React.ReactNode; 
}) {
  return (
    <span className="flex items-center gap-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </span>
  );
});