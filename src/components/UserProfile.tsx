import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function UserProfile({ onLogout, theme, onToggleTheme }: UserProfileProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500 text-white';
      case 'QC':
        return 'bg-yellow-500 text-white';
      case 'Reviewer':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2"
      >
        <div className="w-8 h-8 bg-[#0292DC] rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {getInitials(user.name)}
          </span>
        </div>
        <div className="text-left">
          <div className="text-white text-sm font-medium">{user.name}</div>
          <div className="text-white/70 text-xs">{user.role}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-white/70" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-[#E5E7EB] dark:border-[#3a3a3a] z-20">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#0292DC] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getInitials(user.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#012F66] dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-[#80989A] dark:text-[#a0a0a0]">
                    {user.email}
                  </p>
                  <div className="mt-1">
                    <Badge className={getRoleColor(user.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#012F66] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#3a3a3a]"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    onToggleTheme();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start text-[#012F66] dark:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#3a3a3a]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Toggle Theme
                </Button>
                
                <div className="border-t border-[#E5E7EB] dark:border-[#3a3a3a] my-2" />
                
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Role indicator component
export function RoleIndicator() {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return '👑';
      case 'QC':
        return '🔍';
      case 'Reviewer':
        return '📝';
      default:
        return '👤';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F7FA] dark:bg-[#2a2a2a] rounded-lg">
      <span className="text-lg">{getRoleIcon(user.role)}</span>
      <div>
        <p className="text-sm font-medium text-[#012F66] dark:text-white">
          {user.role}
        </p>
        <p className="text-xs text-[#80989A] dark:text-[#a0a0a0]">
          {user.name}
        </p>
      </div>
    </div>
  );
}
