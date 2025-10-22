import React, { Suspense, lazy } from 'react';
import { LoadingPage } from './LoadingComponents';

// Lazy load components for better performance
const LoginPage = lazy(() => import('./LoginPage').then(module => ({ default: module.LoginPage })));
const Dashboard = lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));
const ValidationScreen = lazy(() => import('./ValidationScreen').then(module => ({ default: module.ValidationScreen })));
const AdminDashboard = lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const QCDashboard = lazy(() => import('./QCDashboard').then(module => ({ default: module.QCDashboard })));
const QCValidationScreen = lazy(() => import('./QCValidationScreen').then(module => ({ default: module.QCValidationScreen })));
const ReviewerDashboard = lazy(() => import('./ReviewerDashboard').then(module => ({ default: module.ReviewerDashboard })));

// Loading fallback component
const LoadingFallback = ({ text = "Loading..." }: { text?: string }) => (
  <LoadingPage text={text} />
);

// Higher-order component for wrapping components with Suspense
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallbackText?: string
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingFallback text={fallbackText} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-configured lazy components with Suspense
export const SuspenseLoginPage = withSuspense(LoginPage, "Loading login page...");
export const SuspenseDashboard = withSuspense(Dashboard, "Loading dashboard...");
export const SuspenseValidationScreen = withSuspense(ValidationScreen, "Loading validation screen...");
export const SuspenseAdminDashboard = withSuspense(AdminDashboard, "Loading admin dashboard...");
export const SuspenseQCDashboard = withSuspense(QCDashboard, "Loading QC dashboard...");
export const SuspenseQCValidationScreen = withSuspense(QCValidationScreen, "Loading QC validation screen...");
export const SuspenseReviewerDashboard = withSuspense(ReviewerDashboard, "Loading reviewer dashboard...");

// Route-based lazy loading
export const LazyComponents = {
  LoginPage: SuspenseLoginPage,
  Dashboard: SuspenseDashboard,
  ValidationScreen: SuspenseValidationScreen,
  AdminDashboard: SuspenseAdminDashboard,
  QCDashboard: SuspenseQCDashboard,
  QCValidationScreen: SuspenseQCValidationScreen,
  ReviewerDashboard: SuspenseReviewerDashboard,
};
