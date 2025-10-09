import React, { ReactNode } from 'react';
import { useAuth, UserRole } from './AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  requireAll = false 
}: RoleGuardProps) {
  const { hasAnyRole, hasRole, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0292DC]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-[#012F66] dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-[#80989A] dark:text-[#a0a0a0] mb-6">
            Please log in to access this page.
          </p>
        </div>
      </div>
    );
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => hasRole(role))
    : hasAnyRole(allowedRoles);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#012F66] dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-[#80989A] dark:text-[#a0a0a0] mb-6">
            You don't have permission to access this page. Required roles: {allowedRoles.join(', ')}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#0292DC] hover:bg-[#012F66] text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const { hasPermission, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0292DC]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['Admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ReviewerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['Reviewer']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function QCOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['QC']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ReviewerOrQC({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['Reviewer', 'QC']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminOrQC({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['Admin', 'QC']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
