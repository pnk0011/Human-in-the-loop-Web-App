import logo from "figma:asset/d37108ff06015dcbcdb272cec41a1cfc0b3b3dfd.png";
import { Button } from "./ui/button";
import { LogOut, Moon, Sun } from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export function DashboardHeader({
  activeTab,
  onTabChange,
  onLogout,
  theme,
  onToggleTheme,
}: DashboardHeaderProps) {
  const tabs = ["Current Queue", "Work History"];

  return (
    <header className="bg-[#012F66] text-white py-3 px-6">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="MedPro" className="h-8" />
          {/* <span className="text-white/80">
            Validation Portal - Document Review
          </span> */}

          {/* Tabs */}
          <div className="flex gap-2 ml-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0292DC] rounded-full flex items-center justify-center">
              <span className="text-white">RV</span>
            </div>
            <div>
              <div className="text-white">Reviewer User</div>
              <div className="text-white/60">Reviewer</div>
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
}