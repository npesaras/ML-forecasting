import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useCompositionData } from "../hooks/useCompositionData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/composition")({
  component: CompositionCharts,
});

function CompositionCharts() {
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const {
    destinationData,
    ageGroupData,
    civilStatusData,
    loading,
    error,
    years,
  } = useCompositionData(selectedYear === "all" ? undefined : selectedYear);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading composition data...</div>
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

  const commonPieProps = {
    margin: { top: 40, right: 80, bottom: 80, left: 80 },
    innerRadius: 0.5,
    padAngle: 0.7,
    cornerRadius: 3,
    activeOuterRadiusOffset: 8,
    borderWidth: 1,
    borderColor: {
      from: "color",
      modifiers: [["darker", 0.2]],
    },
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: "var(--foreground)",
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: { from: "color" },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: {
      from: "color",
      modifiers: [["darker", 2]],
    },
    theme: {
      text: {
        fill: "var(--foreground)",
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
    },
    legends: [
      {
        anchor: "bottom",
        direction: "row",
        justify: false,
        translateX: 0,
        translateY: 56,
        itemsSpacing: 0,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: "var(--foreground)",
        itemDirection: "left-to-right",
        itemOpacity: 1,
        symbolSize: 18,
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
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Composition Charts</h1>
        <p className="text-muted-foreground">
          View data composition and proportions across different categories
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <FilterSelect
          label="Year"
          value={selectedYear.toString()}
          options={[
            { value: "all", label: "All Years (1981-2020)" },
            ...years.map((y) => ({ value: y.toString(), label: y.toString() })),
          ]}
          onChange={(val) => setSelectedYear(val === "all" ? "all" : Number(val))}
        />
      </div>

      {/* No Data Warning */}
      {destinationData.length === 0 && ageGroupData.length === 0 && civilStatusData.length === 0 && (
        <div className="bg-yellow-500/15 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">No Data Available</p>
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
            No composition data found for {selectedYear === "all" ? "1981-2020" : `year ${selectedYear}`}. Please upload CSV data files (destination countries, age groups, and civil status data) using the Upload page.
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destination Countries Pie Chart */}
        <DashboardCard
          title={`Destination Countries Distribution ${selectedYear === "all" ? "(1981-2020)" : `(${selectedYear})`}`}
        >
          {destinationData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No destination data</p>
                <p className="text-sm">Upload country/destination CSV files</p>
              </div>
            </div>
          ) : (
            <div style={{ height: '400px' }}>
              <ResponsivePie
                data={destinationData}
                {...commonPieProps}
                // @ts-ignore
                legends={commonPieProps.legends}
              />
            </div>
          )}
        </DashboardCard>

        {/* Age Groups Pie Chart */}
        <DashboardCard
          title={`Age Groups Distribution ${selectedYear === "all" ? "(1981-2020)" : `(${selectedYear})`}`}
        >
          {ageGroupData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No age group data</p>
                <p className="text-sm">Upload age-related CSV files</p>
              </div>
            </div>
          ) : (
            <div style={{ height: '400px' }}>
              <ResponsivePie
                data={ageGroupData}
                {...commonPieProps}
                // @ts-ignore
                legends={commonPieProps.legends}
              />
            </div>
          )}
        </DashboardCard>

        {/* Civil Status Pie Chart */}
        <DashboardCard
          title={`Civil Status Distribution ${selectedYear === "all" ? "(1981-2020)" : `(${selectedYear})`}`}
        >
          {civilStatusData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No civil status data</p>
                <p className="text-sm">Upload civil status CSV files</p>
              </div>
            </div>
          ) : (
            <div style={{ height: '400px' }}>
              <ResponsivePie
                data={civilStatusData}
                {...commonPieProps}
                // @ts-ignore
                legends={commonPieProps.legends}
              />
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Data Summary */}
      <DashboardCard title="Composition Summary">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Total Destinations</p>
            <p className="text-2xl font-bold">{destinationData.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Age Groups</p>
            <p className="text-2xl font-bold">{ageGroupData.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Civil Statuses</p>
            <p className="text-2xl font-bold">{civilStatusData.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Top Destination</p>
            <p className="text-2xl font-bold">
              {destinationData.length > 0 ? destinationData[0].label : "N/A"}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Most Common Status</p>
            <p className="text-2xl font-bold">
              {civilStatusData.length > 0 ? civilStatusData[0].label : "N/A"}
            </p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
