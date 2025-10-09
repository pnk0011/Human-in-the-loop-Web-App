import React, { useState, useMemo, useCallback } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { DocumentAssignment } from "./DocumentAssignment";
import { UserManagement } from "./UserManagement";
import { AdminAnalytics } from "./AdminAnalytics";
import logo from "figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png";
import { Button } from "./ui/button";
import { LogOut, Moon, Sun } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export const AdminDashboard = React.memo(function AdminDashboard({
  onLogout,
  theme,
  onToggleTheme,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("assignment");

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const tabsData = useMemo(() => [
    { value: "assignment", label: "Document Assignment" },
    { value: "users", label: "User Management" },
    { value: "analytics", label: "Analytics & Progress" }
  ], []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-[#012F66] text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="MedPro" className="h-8" />
            {/* <span className="text-white/80">Admin Portal - Document Management</span> */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFC018] rounded-full flex items-center justify-center">
                <span className="text-[#012F66]">AD</span>
              </div>
              <div>
                <div className="text-white">Admin User</div>
                <div className="text-white/60">
                  Administrator
                </div>
              </div>
            </div>
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
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1400px] mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-6 bg-white dark:bg-[#2a2a2a]">
            {tabsData.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-[#0292DC] data-[state=active]:text-white cursor-pointer"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="assignment">
            <DocumentAssignment />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});