import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { LogOut, Moon, Sun, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png";

export interface TabItem {
  value: string;
  label: string;
}

export interface AppHeaderProps {
  // Navigation
  onBack?: () => void;
  onLogout?: () => void;
  
  // Theme
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  
  // Tabs (optional)
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  
  // Title (optional)
  title?: string;
  subtitle?: string;
  
  // Custom user info (optional - will use auth context if not provided)
  customUser?: {
    name: string;
    role: string;
    initials?: string;
  };
}

export const AppHeader = React.memo(function AppHeader({
  onBack,
  onLogout,
  theme,
  onToggleTheme,
  tabs = [],
  activeTab,
  onTabChange,
  title,
  subtitle,
  customUser,
}: AppHeaderProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#FFC018] text-[#012F66]';
      case 'QC':
        return 'bg-[#FFC018] text-[#012F66]';
      case 'Reviewer':
        return 'bg-[#0292DC] text-white';
      default:
        return 'bg-[#0292DC] text-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Administrator';
      case 'QC':
        return 'Quality Control';
      case 'Reviewer':
        return 'Reviewer';
      default:
        return role;
    }
  };

  // Use custom user or fallback to auth context
  const displayUser = customUser || user;
  const userInitials = displayUser ? getInitials(displayUser.name) : 'U';
  const userRole = displayUser ? displayUser.role : 'User';
  const userName = displayUser ? displayUser.name : 'User';

  return (
    <header className="bg-[#012F66] text-white py-3 px-6">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo, Back Button, Title, Tabs */}
        <div className="flex items-center gap-4">
          {/* Back Button (if provided) */}
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* Logo */}
          <img src={logo} alt="MedPro" className="h-8" />
          
          {/* Title and Subtitle */}
          {(title || subtitle) && (
            <div className="flex flex-col">
              {title && <span className="text-white/80 text-sm">{title}</span>}
              {subtitle && <span className="text-white/60 text-xs">{subtitle}</span>}
            </div>
          )}

          {/* Tabs */}
          {tabs.length > 0 && onTabChange && (
            <div className="flex gap-2 ml-8">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => onTabChange(tab.value)}
                  className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                    activeTab === tab.value
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Section - User Info, Theme Toggle, Logout */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(userRole)}`}>
              <span className="text-sm font-medium">
                {customUser?.initials || userInitials}
              </span>
            </div>
            <div>
              <div className="text-white">{userName}</div>
              <div className="text-white/60">
                {getRoleDisplayName(userRole)}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="text-white hover:bg-white/10"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});

// Convenience components for common use cases
export const DashboardHeader = React.memo(function DashboardHeader({
  activeTab,
  onTabChange,
  onLogout,
  theme,
  onToggleTheme,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  const tabs = useMemo(() => [
    { value: "Current Queue", label: "Current Queue" },
    { value: "Work History", label: "Work History" }
  ], []);

  return (
    <AppHeader
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
    />
  );
});

export const AdminHeader = React.memo(function AdminHeader({
  onLogout,
  theme,
  onToggleTheme,
}: {
  onLogout: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  return (
    <AppHeader
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
      customUser={{
        name: "Admin User",
        role: "Admin",
        initials: "AD"
      }}
    />
  );
});

export const QCHeader = React.memo(function QCHeader({
  activeTab,
  onTabChange,
  onLogout,
  theme,
  onToggleTheme,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  const tabs = useMemo(() => [
    { value: "Current Queue", label: "Current Queue" },
    { value: "Work History", label: "Work History" }
  ], []);

  return (
    <AppHeader
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
      customUser={{
        name: "QC User",
        role: "QC",
        initials: "QC"
      }}
    />
  );
});

export const ValidationHeader = React.memo(function ValidationHeader({
  onBack,
  onLogout,
  theme,
  onToggleTheme,
  title,
  subtitle,
}: {
  onBack: () => void;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <AppHeader
      onBack={onBack}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
      title={title}
      subtitle={subtitle}
    />
  );
});
