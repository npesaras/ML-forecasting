import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ChoroplethMap from "../components/charts/choroplethMap";
import PHOriginChoropleth from "../components/charts/originChoropleth";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useComparisonData } from "../hooks/useComparisonData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";

export const Route = createFileRoute("/geographic")({
  component: GeographicVisualization,
});

type ChoroplethKey = "destination" | "origin";

const choroplethComponents = (year: number | "all") => ({
  destination: <ChoroplethMap selectedYear={year} />,
  origin: <PHOriginChoropleth selectedYear={year} />,
});

function GeographicVisualization() {
  const [selectedMap, setSelectedMap] = useState<ChoroplethKey>("destination");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const stats = useDashboardStats();
  const { data: topDestinations, loading: comparisonLoading, error: comparisonError, years } = useComparisonData(selectedYear === "all" ? undefined : selectedYear);

  // Ensure unique countries and take top 4
  const topFour = useMemo(() => {
    const unique = new Map<string, (typeof topDestinations)[0]>();
    topDestinations.forEach((item) => {
      if (!unique.has(item.country)) {
        unique.set(item.country, item);
      }
    });
    return Array.from(unique.values()).slice(0, 4);
  }, [topDestinations]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Geographic Visualization
        </h1>
        <p className="text-muted-foreground">
          Interactive choropleth maps showing Filipino emigrant data by
          destination countries and origin provinces
        </p>
      </div>

      {/* Debug/Error Information */}
      {stats.error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">Stats Error:</p>
          <p className="text-red-600 dark:text-red-400">{stats.error}</p>
        </div>
      )}
      {comparisonError && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">Comparison Data Error:</p>
          <p className="text-red-600 dark:text-red-400">{comparisonError}</p>
        </div>
      )}

      {/* Map Type Selector */}
      <DashboardCard title="Select Map Type">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FilterSelect
            label="Map Type"
            value={selectedMap}
            options={[
              { value: "destination", label: "Destination Countries" },
              { value: "origin", label: "Origin Provinces" },
            ]}
            onChange={(val) => setSelectedMap(val as ChoroplethKey)}
          />
          <FilterSelect
            label="Data Year"
            value={selectedYear.toString()}
            options={[
              { value: "all", label: "All Years (1981-2020)" },
              ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
            ]}
            onChange={(val) => setSelectedYear(val === "all" ? "all" : parseInt(val))}
          />
        </div>
      </DashboardCard>

      {/* Map Description */}
      <DashboardCard
        title={
          selectedMap === "destination"
            ? "Destination Countries Map"
            : "Origin Provinces Map"
        }
      >
        <p className="text-muted-foreground mb-4">
          {selectedMap === "destination"
            ? "This map shows the distribution of Filipino emigrants across different destination countries. Darker colors indicate higher numbers of emigrants."
            : "This map shows the distribution of Filipino emigrants by their origin provinces within the Philippines. Darker colors indicate higher numbers of emigrants from that region."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Map Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Interactive hover tooltips</li>
              <li>Color-coded data visualization</li>
              <li>Responsive design</li>
              <li>Real-time data updates</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Data Source:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Firebase Firestore Database</li>
              <li>CSV file uploads</li>
              <li>Real-time synchronization</li>
              <li>Multi-year data support</li>
            </ul>
          </div>
        </div>
      </DashboardCard>

      {/* Main Map Display */}
      <DashboardCard title="Map Visualization" className="p-0 overflow-hidden">
        <div className="bg-card p-4">
          {choroplethComponents(selectedYear)[selectedMap]}
        </div>
      </DashboardCard>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Map Statistics">
          {stats.isLoading ? (
            <div className="text-muted-foreground text-center py-4">Loading statistics...</div>
          ) : stats.totalCountries === 0 && stats.totalProvinces === 0 ? (
            <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">No Data Available</p>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                Please upload CSV data using the Upload page to view statistics and maps.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Countries Covered</span>
                <span className="font-semibold">
                  {stats.totalCountries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Philippine Provinces</span>
                <span className="font-semibold">
                  {stats.totalProvinces}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data Years Available</span>
                <span className="font-semibold">
                  {stats.dataYears}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Emigrants Tracked</span>
                <span className="font-semibold">
                  {`${stats.totalEmigrants}M`}
                </span>
              </div>
            </div>
          )}
        </DashboardCard>
        <DashboardCard title="Top Destinations">
          {comparisonLoading ? (
            <div className="text-muted-foreground text-center py-4">Loading destinations...</div>
          ) : topFour.length === 0 ? (
            <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                No destination data available. Please upload country destination data.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topFour.map((item, index) => (
                <div
                  key={`${item.country}-${item.year}-${index}`}
                  className="flex justify-between items-center"
                >
                  <span className="text-muted-foreground">{item.country}</span>
                  <span className="font-semibold">
                    {typeof item.emigrants === "number"
                      ? item.emigrants.toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
