import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ResponsiveRadar } from "@nivo/radar";
import { useYearFilter } from "../hooks/useYearFilter";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/radar")({
  component: RadarPage,
});

interface RadarData {
  category: string;
  [key: string]: string | number;
}

function RadarPage() {
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedYear, setSelectedYear } = useYearFilter();
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchRadarData();
  }, [selectedYear]);

  const fetchRadarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch destination data - UPDATED: Use simpler collection path
      const destinationQuery = query(
        collection(db, "emigrantData_destination"),
        orderBy("Year")
      );
      const destinationSnapshot = await getDocs(destinationQuery);

      // Process destination data
      const destinationData =
        destinationSnapshot.docs.length > 0
          ? destinationSnapshot.docs.map((doc) => doc.data())
          : [];
      const countries = new Set<string>();
      const countryTotals: Record<string, number> = {};

      // UPDATED: Handle nested structure { Year: 2020, "COUNTRY_NAME": { emigrants: 12345 }, ... }
      destinationData.forEach((data: any) => {
        if (
          !selectedYear ||
          selectedYear === "all" ||
          data.Year === selectedYear
        ) {
          Object.entries(data).forEach(([key, value]) => {
            if (key === "Year") return;

            const emigrants =
              typeof value === "object" &&
              value !== null &&
              "emigrants" in value
                ? (value as { emigrants: number }).emigrants
                : null;

            if (emigrants && typeof emigrants === "number" && emigrants > 0) {
              countries.add(key);
              countryTotals[key] = (countryTotals[key] || 0) + emigrants;
            }
          });
        }
      });

      // Create radar data - show top countries with their values
      const radarDataArray: RadarData[] = [];

      // Get top 5 countries
      const topCountries = Object.entries(countryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Create data for each top country
      topCountries.forEach(([country, total]) => {
        // Ensure total is a valid number
        const validTotal =
          typeof total === "number" && !isNaN(total) ? total : 0;
        const countryData: RadarData = {
          category: country,
          "Total Emigrants": validTotal,
        };
        radarDataArray.push(countryData);
      });

      // Extract available years from the data
      const years = new Set<number>();
      if (destinationSnapshot.docs.length > 0) {
        destinationSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.Year && typeof data.Year === "number") {
            years.add(data.Year);
          }
        });
      }
      setAvailableYears(Array.from(years).sort((a, b) => a - b));

      // If no data available, show sample data
      if (
        radarDataArray.length === 0 ||
        Object.keys(countryTotals).length === 0
      ) {
        const sampleData: RadarData[] = [
          { category: "Sample Country 1", "Total Emigrants": 1000 },
          { category: "Sample Country 2", "Total Emigrants": 800 },
          { category: "Sample Country 3", "Total Emigrants": 600 },
        ];
        setRadarData(sampleData);
      } else {
        setRadarData(radarDataArray);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      // Set fallback data on error
      const fallbackData: RadarData[] = [
        { category: "No Data", "Total Emigrants": 0 },
      ];
      setRadarData(fallbackData);
      setAvailableYears([]); // Set empty years array on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading radar chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert title="Error loading data" message={error} />
        <button
          onClick={fetchRadarData}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Ranking Analysis
        </h1>
        <p className="text-muted-foreground">
          Multi-dimensional ranking comparison of emigrant data across
          different categories using radar charts.
        </p>
      </div>

      {/* Year Filter */}
      <div className="flex items-center space-x-4">
        <FilterSelect
          label="Select Year"
          value={selectedYear || "all"}
          options={[
            { value: "all", label: "All Years" },
            ...availableYears.map((y) => ({ value: y, label: y.toString() })),
          ]}
          onChange={(val) =>
            setSelectedYear(val === "all" ? "all" : parseInt(val as string))
          }
        />
        <p className="text-sm text-muted-foreground mt-6">
          Showing top 5 countries by total emigrant count
        </p>
      </div>

      {/* No Data Message */}
      {radarData.length === 0 && !loading && (
        <DashboardCard title="No Data Available">
          <p className="text-muted-foreground mb-4">
            Please upload CSV files to see ranking analysis.
          </p>
          <a
            href="/upload"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Upload Page
          </a>
        </DashboardCard>
      )}

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <DashboardCard title="Ranking Radar Chart">
          <div style={{ height: '500px' }}>
            <ResponsiveRadar
            data={radarData}
            keys={["Total Emigrants"]}
            indexBy="category"
            valueFormat=">-.0f"
            margin={{ top: 70, right: 80, bottom: 70, left: 80 }}
            borderColor={{ from: "color" }}
            gridLabelOffset={36}
            dotSize={10}
            dotColor={{ theme: "background" }}
            dotBorderWidth={2}
            colors={["var(--chart-1)"]}
            fillOpacity={0.65}
            blendMode="normal"
            motionConfig="wobbly"
            theme={{
              axis: {
                domain: { line: { stroke: "var(--border)", strokeWidth: 1 } },
                legend: { text: { fill: "var(--muted-foreground)", fontSize: 14 } },
                ticks: {
                  line: { stroke: "var(--border)", strokeWidth: 1 },
                  text: { fill: "var(--muted-foreground)", fontSize: 12 },
                },
              },
              legends: {
                text: { fill: "var(--muted-foreground)" },
              },
              grid: {
                line: { stroke: "var(--border)", strokeWidth: 0.6, opacity: 0.4 },
              },
              labels: {
                text: { fill: "var(--foreground)" },
              },
              dots: {
                text: { fill: "var(--foreground)" },
              },
              tooltip: {
                container: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                },
              },
            }}
            legends={[
              {
                anchor: "top-left",
                direction: "column",
                translateX: -50,
                translateY: -40,
                itemWidth: 80,
                itemHeight: 20,
                itemTextColor: "var(--foreground)",
                symbolSize: 12,
                symbolShape: "circle",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: "var(--primary)",
                    },
                  },
                ],
              },
            ]}
          />
          </div>
        </DashboardCard>
      )}

      {/* Chart Description */}
      <DashboardCard title="How to Read This Chart">
        <ul className="text-muted-foreground space-y-2">
          <li>
            • <strong>Spider/Web Shape:</strong> Each axis represents a
            different data category
          </li>
          <li>
            • <strong>Area Coverage:</strong> Larger areas indicate higher
            values across multiple dimensions
          </li>
          <li>
            • <strong>Shape Comparison:</strong> Different shapes reveal
            unique patterns for each country
          </li>
          <li>
            • <strong>Overlap Analysis:</strong> Overlapping areas show
            similar characteristics between countries
          </li>
        </ul>
      </DashboardCard>
    </div>
  );
}
