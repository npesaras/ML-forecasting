import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useComparisonData } from "../hooks/useComparisonData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/comparison")({
  component: ComparisonCharts,
});

function ComparisonCharts() {
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const { data, loading, error, years } = useComparisonData(selectedYear);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading comparison data...</div>
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

  const yearOptions = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Comparison Charts
        </h1>
        <p className="text-muted-foreground">
          Compare emigrant data across different countries and categories
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <FilterSelect
          label="Year"
          value={selectedYear.toString()}
          onChange={(value) => setSelectedYear(Number(value))}
          options={yearOptions}
          placeholder="Select a year"
        />
      </div>

      {/* Chart */}
      <DashboardCard
        title={`Top Countries by Emigrants (${selectedYear})`}
      >
        <div style={{ height: '500px' }}>
          <ResponsiveBar
          data={data as any}
          keys={["emigrants"]}
          indexBy="country"
          margin={{ top: 50, right: 130, bottom: 100, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "nivo" }}
          borderColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 10,
            tickRotation: -45,
            legend: "Country",
            legendPosition: "middle",
            legendOffset: 70,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Number of Emigrants",
            legendPosition: "middle",
            legendOffset: -50,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
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
            tooltip: {
              container: {
                background: "var(--card)",
                color: "var(--card-foreground)",
              },
            },
          }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              itemTextColor: "var(--foreground)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemOpacity: 1,
                    itemTextColor: "var(--primary)",
                  },
                },
              ],
            },
          ]}
          role="application"
          ariaLabel="Emigrants comparison chart"
          barAriaLabel={(e) =>
            `Country: ${e.id}, Emigrants: ${e.formattedValue}`
          }
        />
        </div>
      </DashboardCard>

      {/* Data Summary */}
      <DashboardCard title="Comparison Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Total Countries</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Total Emigrants</p>
            <p className="text-2xl font-bold">
              {data
                .reduce((sum, item) => sum + item.emigrants, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Top Country</p>
            <p className="text-2xl font-bold">
              {data.length > 0 ? data[0].country : "N/A"}
            </p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
