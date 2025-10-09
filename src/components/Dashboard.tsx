import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { ValidationQueue } from './ValidationQueue';
import { WorkHistory } from './WorkHistory';

interface QueueItem {
  id: string;
  document: string;
  type: string;
  field: string;
  confidence: number;
  priority: 'High' | 'Medium' | 'Low';
  age: string;
  assignedTo: string;
  extractedValue?: string;
  fieldDescription?: string;
  expectedFormat?: string;
}

interface DashboardProps {
  onValidateClick: (item: QueueItem) => void;
  onViewHistoryClick?: (doc: any) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function Dashboard({ onValidateClick, onViewHistoryClick, onLogout, theme, onToggleTheme }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('Current Queue');

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a]">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      
      <main className="p-6 max-w-[1400px] mx-auto">
        {activeTab === 'Current Queue' ? (
          <>
            <DashboardStats />
            <ValidationQueue onValidateClick={onValidateClick} />
          </>
        ) : activeTab === 'Work History' ? (
          <WorkHistory onViewClick={onViewHistoryClick || (() => {})} />
        ) : null}
      </main>
    </div>
  );
}
