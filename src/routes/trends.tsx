import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTrendData } from "../hooks/useTrendData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/trends")({
  component: TrendAnalysis,
});

function TrendAnalysis() {
  const [selectedCountry, setSelectedCountry] = useState<string>("USA");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("all");

  const {
    ageGroupTrends,
    loading,
    error,
    countries,
    ageGroups,
  } = useTrendData(selectedCountry);

  // Set default age group when data loads
  useEffect(() => {
    if (!selectedAgeGroup && ageGroups.length > 0) {
      setSelectedAgeGroup(ageGroups[0]);
    }
  }, [ageGroups, selectedAgeGroup]);

  // Ensure USA is selected when countries load
  useEffect(() => {
    if (countries.length > 0 && !countries.includes(selectedCountry)) {
      const usaCountry = countries.find(c => c.toUpperCase().includes("USA") || c.includes("UNITED STATES"));
      if (usaCountry) {
        setSelectedCountry(usaCountry);
      } else {
        setSelectedCountry(countries[0]);
      }
    }
  }, [countries]);

  // Transform data for area chart
  const chartData = useMemo(() => {
    const selectedData = ageGroupTrends.find(
      (trend) => trend.id === selectedAgeGroup
    );

    if (!selectedData) return [];

    return selectedData.data.map((point: any) => ({
      year: point.x,
      emigrants: point.y,
    }));
  }, [ageGroupTrends, selectedAgeGroup]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === "all" || chartData.length === 0) return chartData;

    const yearsToShow = parseInt(timeRange);
    return chartData.slice(-yearsToShow);
  }, [chartData, timeRange]);

  const chartConfig = {
    emigrants: {
      label: "Emigrants",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading trend data...</div>
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
        <h1 className="text-3xl font-bold tracking-tight">Trend Analysis</h1>
        <p className="text-muted-foreground">
          Analyze emigrant trends over time across different countries and age groups
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <FilterSelect
          label="Country"
          value={selectedCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
          onChange={setSelectedCountry}
          className="w-full sm:w-[200px]"
          placeholder="USA"
        />
        <FilterSelect
          label="Age Group"
          value={selectedAgeGroup}
          options={ageGroups.map((g) => ({ value: g, label: g }))}
          onChange={setSelectedAgeGroup}
          className="w-full sm:w-[200px]"
        />
      </div>

      {/* Interactive Area Chart */}
      <DashboardCard
        title={`Emigrant Trends - ${selectedCountry} (${selectedAgeGroup})`}
        description={`Showing emigrant data for ${timeRange === "all" ? "all years" : `last ${timeRange} years`}`}
      >
        <div className="flex items-center justify-end gap-2 pb-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Select time range"
            >
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Years
              </SelectItem>
              <SelectItem value="20" className="rounded-lg">
                Last 20 Years
              </SelectItem>
              <SelectItem value="10" className="rounded-lg">
                Last 10 Years
              </SelectItem>
              <SelectItem value="5" className="rounded-lg">
                Last 5 Years
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillEmigrants" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-emigrants)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-emigrants)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              label={{
                value: "Emigrants",
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--foreground)" },
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Year: ${value}`}
                  indicator="dot"
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} emigrants`,
                    "Total",
                  ]}
                />
              }
            />
            <Area
              dataKey="emigrants"
              type="monotone"
              fill="url(#fillEmigrants)"
              stroke="var(--color-emigrants)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </DashboardCard>

      {/* Data Summary */}
      <DashboardCard title="Trend Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Countries Tracked</p>
            <p className="text-2xl font-bold text-foreground">{countries.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Age Groups</p>
            <p className="text-2xl font-bold text-foreground">{ageGroups.length}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Selected Country</p>
            <p className="text-2xl font-bold text-foreground">{selectedCountry}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">Selected Age Group</p>
            <p className="text-2xl font-bold text-foreground">{selectedAgeGroup}</p>
          </div>
        </div>
      </DashboardCard>

      {/* Additional Statistics */}
      {filteredData.length > 0 && (
        <DashboardCard title="Statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">Highest Year</p>
              <p className="text-xl font-bold text-foreground">
                {filteredData.reduce((max, item) =>
                  item.emigrants > max.emigrants ? item : max
                ).year}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredData.reduce((max, item) =>
                  item.emigrants > max.emigrants ? item : max
                ).emigrants.toLocaleString()} emigrants
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">Lowest Year</p>
              <p className="text-xl font-bold text-foreground">
                {filteredData.reduce((min, item) =>
                  item.emigrants < min.emigrants ? item : min
                ).year}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredData.reduce((min, item) =>
                  item.emigrants < min.emigrants ? item : min
                ).emigrants.toLocaleString()} emigrants
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">Average</p>
              <p className="text-xl font-bold text-foreground">
                {Math.round(
                  filteredData.reduce((sum, item) => sum + item.emigrants, 0) /
                  filteredData.length
                ).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">emigrants/year</p>
            </div>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
