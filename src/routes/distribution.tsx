import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { useDistributionData } from "../hooks/useDistributionData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/distribution")({
  component: DistributionCharts,
});

function DistributionCharts() {
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const { distributionData, loading, error, years, statistics } =
    useDistributionData(selectedYear);

  // Convert country distribution data to density curves
  const countryDensityData = useMemo(() => {
    return distributionData.slice(0, 5).map((series) => ({
      id: series.id,
      data: series.data.map((point) => ({
        x: point.x,
        y: point.y,
      })),
    }));
  }, [distributionData]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading distribution data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert title="Error loading data" message={error} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Emigrant Trends by Country
        </h1>
        <p className="text-muted-foreground">
          Visualize emigrant trends over time for top destination countries
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <FilterSelect
          label="Year"
          value={selectedYear}
          options={years.map((y) => ({ value: y, label: y.toString() }))}
          onChange={(val) => setSelectedYear(Number(val))}
        />
        <p className="text-sm text-muted-foreground mt-6">
          Select a year to view the country distribution for that period.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Country Distribution Density Plot */}
        <DashboardCard
          title="Top Countries Emigrant Trends (1980-2021)"
        >
          <div style={{ height: '500px' }}>
            <ResponsiveLine
            data={countryDensityData}
            margin={{ top: 50, right: 180, bottom: 70, left: 80 }}
            xScale={{ type: "linear", min: 1980, max: 2021 }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
            }}
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 10,
              tickRotation: 0,
              legend: "Year",
              legendOffset: 50,
              legendPosition: "middle",
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 10,
              tickRotation: 0,
              legend: "Count",
              legendOffset: -60,
              legendPosition: "middle",
            }}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.15}
            colors={{ scheme: "nivo" }}
            lineWidth={3}
            enableGridX={false}
            enableGridY={true}
            gridYValues={5}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: "var(--muted-foreground)",
                  },
                },
                legend: {
                  text: {
                    fill: "var(--muted-foreground)",
                  },
                },
              },
              grid: {
                line: {
                  stroke: "var(--border)",
                  strokeWidth: 1,
                },
              },
              legends: {
                text: {
                  fill: "var(--muted-foreground)",
                },
              },
              tooltip: {
                container: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  fontSize: 12,
                  borderRadius: 6,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                },
              },
            }}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 140,
                translateY: 0,
                itemsSpacing: 2,
                itemDirection: "left-to-right",
                itemWidth: 120,
                itemHeight: 20,
                itemOpacity: 0.85,
                symbolSize: 12,
                symbolShape: "circle",
                itemTextColor: "var(--foreground)",
              },
            ]}
            useMesh={true}
          />
          </div>
        </DashboardCard>
      </div>

      {/* Statistical Summary */}
      <DashboardCard title="Distribution Statistics">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Mean</p>
            <p className="text-2xl font-bold">
              {statistics.mean.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Median</p>
            <p className="text-2xl font-bold">
              {statistics.median.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Standard Deviation</p>
            <p className="text-2xl font-bold">
              {statistics.standardDeviation.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Range</p>
            <p className="text-2xl font-bold">
              {statistics.range.toLocaleString()}
            </p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
