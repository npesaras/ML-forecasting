import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  AiOutlineBarChart,
  AiOutlinePieChart,
  AiOutlineLineChart,
  AiOutlineAreaChart,
  AiOutlineDotChart,
  AiOutlineUpload,
  AiOutlineGlobal,
  AiOutlineRadarChart,
  AiOutlineNodeIndex,
  AiOutlineDatabase,
} from "react-icons/ai";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ErrorAlert } from "@/components/ErrorAlert";

export const Route = createFileRoute("/")({
  component: Index,
});

const dashboardCards = [
  {
    title: "Geographic Visualization",
    description: "Interactive choropleth maps of emigrant data",
    icon: <AiOutlineGlobal className="text-4xl text-primary" />,
    path: "/geographic",
  },
  {
    title: "Comparison Charts",
    description: "Compare emigrant data across different categories",
    icon: <AiOutlineBarChart className="text-4xl text-primary" />,
    path: "/comparison",
  },
  {
    title: "Composition Charts",
    description: "View data composition and proportions",
    icon: <AiOutlinePieChart className="text-4xl text-primary" />,
    path: "/composition",
  },
  {
    title: "Trend Analysis",
    description: "Analyze trends over time",
    icon: <AiOutlineLineChart className="text-4xl text-primary" />,
    path: "/trends",
  },
  {
    title: "Distribution Charts",
    description: "Visualize data distribution patterns",
    icon: <AiOutlineAreaChart className="text-4xl text-primary" />,
    path: "/distribution",
  },
  {
    title: "Relationship Analysis",
    description: "Explore correlations and relationships",
    icon: <AiOutlineDotChart className="text-4xl text-primary" />,
    path: "/relationships",
  },
  {
    title: "Radar Chart Analysis",
    description: "Compare multiple dimensions using spider/web charts",
    icon: <AiOutlineRadarChart className="text-4xl text-primary" />,
    path: "/radar",
  },
  {
    title: "Parallel Sets Flow",
    description: "Visualize data flow between categories",
    icon: <AiOutlineNodeIndex className="text-4xl text-primary" />,
    path: "/parallel",
  },
  {
    title: "Upload Data",
    description: "Upload CSV files to Firebase",
    icon: <AiOutlineUpload className="text-4xl text-primary" />,
    path: "/upload",
  },
  {
    title: "Data Management (CRUD)",
    description: "Create, read, update, and delete data records",
    icon: <AiOutlineDatabase className="text-4xl text-primary" />,
    path: "/crud",
  },
];

function Index() {
  const stats = useDashboardStats();

  if (stats.isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="p-6">
        <ErrorAlert title="Error loading dashboard" message={stats.error} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Emigrant Data Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive analysis and visualization of emigrant statistics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Emigrants"
          value={`${stats.totalEmigrants}M`}
          icon={<AiOutlineGlobal />}
        />
        <StatsCard
          label="Countries"
          value={stats.totalCountries.toString()}
          icon={<AiOutlineGlobal />}
        />
        <StatsCard
          label="Provinces"
          value={stats.totalProvinces.toString()}
          icon={<AiOutlineNodeIndex />}
        />
        <StatsCard
          label="Years Covered"
          value={stats.dataYears}
          icon={<AiOutlineLineChart />}
        />
      </div>

      {/* Navigation Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Analysis Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="block transition-transform hover:-translate-y-1"
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {card.icon}
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
