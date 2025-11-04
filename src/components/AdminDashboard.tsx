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
import { AdminHeader } from "./AppHeader";

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
      <AdminHeader onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />

      {/* Main Content */}
      <main className="p-6 w-full">
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