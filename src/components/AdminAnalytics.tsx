import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { Card } from "./ui/card";

// Sample data for charts
const reviewerPerformanceData = [
  { name: "John Doe", completed: 127, accuracy: 94, avgTime: 8.5 },
  { name: "Sarah Smith", completed: 145, accuracy: 96, avgTime: 7.2 },
  { name: "Mike Johnson", completed: 118, accuracy: 91, avgTime: 9.1 },
  { name: "Emily Davis", completed: 132, accuracy: 95, avgTime: 7.8 },
  { name: "Robert Wilson", completed: 98, accuracy: 89, avgTime: 10.2 },
];

const documentTypeData = [
  { name: "Medicare Claim", value: 342, color: "#0292DC" },
  { name: "Invoice", value: 287, color: "#012F66" },
  { name: "Policy Amendment", value: 198, color: "#FFC018" },
  { name: "Authorization", value: 156, color: "#4ECDC4" },
  { name: "Claim Adjustment", value: 124, color: "#FF6B9D" },
];

const priorityDistributionData = [
  { priority: "High", count: 89, color: "#FF0081" },
  { priority: "Medium", count: 145, color: "#FFC018" },
  { priority: "Low", count: 67, color: "#80989A" },
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down";
  color: string;
}

function StatCard({
  icon,
  label,
  value,
  change,
  trend,
  color,
}: StatCardProps) {
  return (
    <Card className="p-6 bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#80989A] dark:text-[#a0a0a0] mb-2">{label}</p>
          <h3 className="text-[#012F66] dark:text-white mb-2">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-2">
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-[#4ECDC4]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#FF0081]" />
              )}
              <span
                className={
                  trend === "up" ? "text-[#4ECDC4]" : "text-[#FF0081]"
                }
              >
                {change}% vs last week
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center`}
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={<FileCheck className="w-6 h-6" />}
          label="Total Documents Processed"
          value="1,247"
          change={12.5}
          trend="up"
          color="#0292DC"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Active Reviewers"
          value="12"
          change={8.3}
          trend="up"
          color="#4ECDC4"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviewer Performance */}
        <Card className="p-6 bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="mb-6">
            <h3 className="text-[#012F66] dark:text-white mb-1">
              Reviewer Performance
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0]">
              Documents completed vs accuracy rate
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reviewerPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#80989A"
                style={{ fontSize: "11px" }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" stroke="#80989A" style={{ fontSize: "12px" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#80989A"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="completed"
                fill="#0292DC"
                radius={[8, 8, 0, 0]}
                name="Completed"
              />
              <Bar
                yAxisId="right"
                dataKey="accuracy"
                fill="#4ECDC4"
                radius={[8, 8, 0, 0]}
                name="Accuracy %"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Document Type Distribution */}
        <Card className="p-6 bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="mb-6">
            <h3 className="text-[#012F66] dark:text-white mb-1">
              Document Type Distribution
            </h3>
            <p className="text-[#80989A] dark:text-[#a0a0a0]">
              Breakdown by document category
            </p>
          </div>
          <div className="flex items-center justify-between gap-6">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {documentTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#012F66] dark:text-white">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[#80989A] dark:text-[#a0a0a0]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="p-6 bg-white dark:bg-[#2a2a2a] border-[#E5E7EB] dark:border-[#3a3a3a]">
        <div className="mb-6">
          <h3 className="text-[#012F66] dark:text-white mb-1">
            Queue Priority Distribution
          </h3>
          <p className="text-[#80989A] dark:text-[#a0a0a0]">
            Current queue breakdown by priority level
          </p>
        </div>
        <div className="space-y-4">
          {priorityDistributionData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#012F66] dark:text-white">
                    {item.priority}
                  </span>
                </div>
                <span className="text-[#80989A] dark:text-[#a0a0a0]">
                  {item.count}
                </span>
              </div>
              <div className="w-full bg-[#F5F7FA] dark:bg-[#1a1a1a] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(item.count / 301) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#3a3a3a]">
          <div className="flex items-center justify-between">
            <span className="text-[#80989A] dark:text-[#a0a0a0]">Total</span>
            <span className="text-[#012F66] dark:text-white">301 docs</span>
          </div>
        </div>
      </Card>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#4ECDC4]/10 to-[#4ECDC4]/5 border-[#4ECDC4]/20 dark:from-[#4ECDC4]/20 dark:to-[#4ECDC4]/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#4ECDC4]" />
                <h4 className="text-[#012F66] dark:text-white">
                  Approved
                </h4>
              </div>
              <p className="text-[#012F66] dark:text-white mb-1">856</p>
              <p className="text-[#4ECDC4]">68.6% of total</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FFC018]/10 to-[#FFC018]/5 border-[#FFC018]/20 dark:from-[#FFC018]/20 dark:to-[#FFC018]/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-[#FFC018]" />
                <h4 className="text-[#012F66] dark:text-white">
                  Pending Review
                </h4>
              </div>
              <p className="text-[#012F66] dark:text-white mb-1">301</p>
              <p className="text-[#FFC018]">24.1% of total</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#FF0081]/10 to-[#FF0081]/5 border-[#FF0081]/20 dark:from-[#FF0081]/20 dark:to-[#FF0081]/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-[#FF0081]" />
                <h4 className="text-[#012F66] dark:text-white">
                  Sent Back
                </h4>
              </div>
              <p className="text-[#012F66] dark:text-white mb-1">90</p>
              <p className="text-[#FF0081]">7.2% of total</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
