import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { FileText, CheckCircle2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const StatCard = React.memo(function StatCard({ title, value, subtitle, subtitleColor, icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="p-6 bg-white dark:bg-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow border border-[#E5E7EB] dark:border-[#3a3a3a]">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-[#80989A] dark:text-[#a0a0a0]">{title}</p>
          <div>
            <p className="text-[#012F66] dark:text-white text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className={`mt-1 ${subtitleColor || 'text-[#80989A] dark:text-[#a0a0a0]'}`}>{subtitle}</p>
            )}
          </div>
        </div>
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
});

type DashboardStatsShape = Record<string, number | string | undefined> | undefined;

interface DashboardStatsProps {
  stats?: DashboardStatsShape;
}

export const DashboardStats = React.memo(function DashboardStats({ stats }: DashboardStatsProps) {
  const statsData = useMemo(() => {
    const entries = Object.entries(stats || {}).filter(([, value]) => value !== undefined && value !== null);
    const topTwo = entries.slice(0, 2);

    const iconPalette = [
      { icon: <FileText className="w-6 h-6" />, iconBgColor: "bg-[#0292DC]/10", iconColor: "text-[#0292DC]" },
      { icon: <CheckCircle2 className="w-6 h-6" />, iconBgColor: "bg-[#10B981]/10", iconColor: "text-[#10B981]" },
    ];

    return topTwo.map(([key, value], idx) => {
      const baseTitle = key.replace(/_/g, " ");
      const title = baseTitle
        .replace(/Accounts/gi, "Policies")
        .replace(/Account/gi, "Policy");

      return {
        title,
        value: value as number | string,
        icon: iconPalette[idx]?.icon || iconPalette[0].icon,
        iconBgColor: iconPalette[idx]?.iconBgColor || iconPalette[0].iconBgColor,
        iconColor: iconPalette[idx]?.iconColor || iconPalette[0].iconColor,
      };
    });
  }, [stats]);

  if (!statsData.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {statsData.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconBgColor={stat.iconBgColor}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
});