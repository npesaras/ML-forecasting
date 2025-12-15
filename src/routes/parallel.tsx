import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { useYearFilter } from "../hooks/useYearFilter";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/parallel")({
  component: ParallelSetsPage,
});

interface SankeyNode {
  id: string;
  nodeColor: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Cache for Firebase data
const dataCache = new Map<string, any[]>();
const cacheTimestamp = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000;

function ParallelSetsPage() {
  const [sankeyData, setSankeyData] = useState<SankeyData>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<
    "destination-age" | "destination-education" | "age-education"
  >("destination-age");

  const { selectedYear, setSelectedYear } = useYearFilter();
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [countryLimit, setCountryLimit] = useState<number>(8);
  const [categoryLimit, setCategoryLimit] = useState<number>(8);
  const [excludedCountriesInput, setExcludedCountriesInput] =
    useState<string>("");

  const excludedCountries = useMemo(() => {
    return excludedCountriesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [excludedCountriesInput]);

  const fetchCachedData = useCallback(async (collectionPath: string) => {
    const cacheKey = collectionPath;
    const now = Date.now();

    if (dataCache.has(cacheKey) && cacheTimestamp.has(cacheKey)) {
      const cacheAge = now - cacheTimestamp.get(cacheKey)!;
      if (cacheAge < CACHE_DURATION) {
        console.log(`Using cached data for ${collectionPath}`);
        return dataCache.get(cacheKey)!;
      }
    }

    console.log(`Fetching fresh data for ${collectionPath}`);
    const q = query(collection(db, collectionPath), orderBy("Year"));
    const snapshot = await getDocs(q);
    const data =
      snapshot.docs.length > 0 ? snapshot.docs.map((doc) => doc.data()) : [];

    dataCache.set(cacheKey, data);
    cacheTimestamp.set(cacheKey, now);

    return data;
  }, []);

  useEffect(() => {
    fetchParallelData();
  }, [
    selectedYear,
    selectedFlow,
    countryLimit,
    categoryLimit,
    excludedCountries,
  ]);

  const fetchParallelData = async () => {
    try {
      setLoading(true);
      setError(null);

      // UPDATED: Use simpler collection paths
      const [destinationData, ageData, educationData] = await Promise.all([
        fetchCachedData("emigrantData_destination"),
        fetchCachedData("emigrantData_age"),
        fetchCachedData("emigrantData_education"),
      ]);

      // Extract available years
      const years = new Set<number>();
      [destinationData, ageData, educationData].forEach((dataset) => {
        dataset.forEach((d: any) => {
          if (d.Year && typeof d.Year === "number") years.add(d.Year);
        });
      });
      setAvailableYears(Array.from(years).sort((a, b) => a - b));

      // Filter data by year
      const filterByYear = (data: any[]) => {
        if (!selectedYear || selectedYear === "all") return data;
        return data.filter((d) => d.Year === selectedYear);
      };

      const destFiltered = filterByYear(destinationData);
      const ageFiltered = filterByYear(ageData);
      const eduFiltered = filterByYear(educationData);

      // Process data based on selected flow
      let sourceData: Record<string, number> = {};
      let targetData: Record<string, number> = {};
      let sourceLabel = "";
      let targetLabel = "";

      if (selectedFlow === "destination-age") {
        sourceLabel = "Destination";
        targetLabel = "Age Group";
        sourceData = aggregateData(destFiltered, excludedCountries);
        targetData = aggregateData(ageFiltered, []);
      } else if (selectedFlow === "destination-education") {
        sourceLabel = "Destination";
        targetLabel = "Education";
        sourceData = aggregateData(destFiltered, excludedCountries);
        targetData = aggregateData(eduFiltered, []);
      } else if (selectedFlow === "age-education") {
        sourceLabel = "Age Group";
        targetLabel = "Education";
        sourceData = aggregateData(ageFiltered, []);
        targetData = aggregateData(eduFiltered, []);
      }

      // Generate Sankey nodes and links
      const { nodes, links } = generateSankeyData(
        sourceData,
        targetData,
        sourceLabel,
        targetLabel,
        selectedFlow.startsWith("destination") ? countryLimit : categoryLimit,
        selectedFlow.endsWith("education") ? categoryLimit : 8
      );

      setSankeyData({ nodes, links });
    } catch (err) {
      console.error("Error fetching parallel data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const aggregateData = (data: any[], excluded: string[]) => {
    const totals: Record<string, number> = {};
    data.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key === "Year") return;
        if (excluded.some((ex) => key.toLowerCase().includes(ex.toLowerCase())))
          return;

        const count =
          typeof value === "object" && value !== null && "emigrants" in value
            ? (value as { emigrants: number }).emigrants
            : typeof value === "number"
              ? value
              : 0;

        if (count > 0) {
          totals[key] = (totals[key] || 0) + count;
        }
      });
    });
    return totals;
  };

  const generateSankeyData = (
    sourceData: Record<string, number>,
    targetData: Record<string, number>,
    sourceLabel: string,
    targetLabel: string,
    sourceLimit: number,
    targetLimit: number
  ) => {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Get top N items
    const getTopItems = (data: Record<string, number>, limit: number) => {
      return Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);
    };

    const topSources = getTopItems(sourceData, sourceLimit);
    const topTargets = getTopItems(targetData, targetLimit);

    // Add nodes
    topSources.forEach(([name]) => {
      nodes.push({
        id: `${sourceLabel}: ${name}`,
        nodeColor: "hsl(var(--chart-1))",
      });
    });

    topTargets.forEach(([name]) => {
      nodes.push({
        id: `${targetLabel}: ${name}`,
        nodeColor: "hsl(var(--chart-2))",
      });
    });

    // Create links (distribute proportionally)
    const totalSource = topSources.reduce((sum, [, val]) => sum + val, 0);
    const totalTarget = topTargets.reduce((sum, [, val]) => sum + val, 0);

    // Normalize to avoid huge discrepancies if datasets don't match perfectly
    // In a real scenario, we would have direct links, but here we simulate flow based on distribution
    topSources.forEach(([sourceName, sourceValue]) => {
      topTargets.forEach(([targetName, targetValue]) => {
        // Calculate weight based on relative proportions
        const weight =
          (sourceValue / totalSource) * (targetValue / totalTarget);
        // Scale to approximate actual numbers (using average of totals)
        const value = weight * ((totalSource + totalTarget) / 2);

        links.push({
          source: `${sourceLabel}: ${sourceName}`,
          target: `${targetLabel}: ${targetName}`,
          value: Math.round(value),
        });
      });
    });

    return { nodes, links };
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading parallel sets data...</div>
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
          Parallel Sets Analysis
        </h1>
        <p className="text-muted-foreground">
          Visualize flow and relationships between different data categories
        </p>
      </div>

      {/* Controls */}
      <DashboardCard title="Analysis Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FilterSelect
            label="Select Year"
            value={selectedYear || "all"}
            onChange={(val) =>
              setSelectedYear(val === "all" ? "all" : parseInt(val as string))
            }
            options={[
              { value: "all", label: "All Years" },
              ...availableYears.map((y) => ({ value: y, label: y.toString() })),
            ]}
          />

          <FilterSelect
            label="Analysis Flow"
            value={selectedFlow}
            onChange={(val) => setSelectedFlow(val as any)}
            options={[
              { value: "destination-age", label: "Destination → Age Group" },
              {
                value: "destination-education",
                label: "Destination → Education",
              },
              { value: "age-education", label: "Age Group → Education" },
            ]}
          />

          <div className="space-y-2">
            <Label>Limit Items (Top N)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={countryLimit}
                onChange={(e) => setCountryLimit(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full"
                placeholder="Source Limit"
              />
              <Input
                type="number"
                value={categoryLimit}
                onChange={(e) => setCategoryLimit(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full"
                placeholder="Target Limit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exclude (comma separated)</Label>
            <Input
              type="text"
              value={excludedCountriesInput}
              onChange={(e) => setExcludedCountriesInput(e.target.value)}
              placeholder="e.g., USA, Canada"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Sankey Chart */}
      <DashboardCard title="Data Flow Visualization">
        <div style={{ height: '600px' }}>
          {sankeyData.nodes.length > 0 ? (
            <ResponsiveSankey
            data={sankeyData}
            margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
            align="justify"
            colors={{ scheme: "category10" }}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.35}
            nodeThickness={18}
            nodeSpacing={24}
            nodeBorderWidth={0}
            nodeBorderColor={{
              from: "color",
              modifiers: [["darker", 0.8]],
            }}
            linkOpacity={0.5}
            linkHoverOthersOpacity={0.1}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1]],
            }}
            theme={{
              labels: {
                text: {
                  fill: "var(--foreground)",
                  fontSize: 12,
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
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available for the selected criteria
          </div>
        )}
        </div>
      </DashboardCard>

      {/* Description */}
      <DashboardCard title="About Parallel Sets">
        <p className="text-muted-foreground">
          This visualization shows the relationship between two categories of
          data. The width of the lines represents the volume of emigrants. You
          can use the controls above to filter by year, change the categories
          being compared, limit the number of items shown, or exclude specific
          items to focus on others.
        </p>
      </DashboardCard>
    </div>
  );
}
