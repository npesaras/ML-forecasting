import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useRelationshipData } from "../hooks/useRelationshipData";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/relationships")({
  component: RelationshipCharts,
});

function RelationshipCharts() {
  const [selectedMetric, setSelectedMetric] = useState<string>("age-income");
  const {
    ageIncomeData,
    educationIncomeData,
    countryDistanceData,
    correlationData,
    loading,
    error,
  } = useRelationshipData(selectedMetric);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading relationship data...</div>
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

  const getCurrentData = () => {
    switch (selectedMetric) {
      case "age-income":
        return ageIncomeData;
      case "education-income":
        return educationIncomeData;
      case "distance-emigrants":
        return countryDistanceData;
      default:
        return ageIncomeData;
    }
  };

  const getCurrentLabels = () => {
    switch (selectedMetric) {
      case "age-income":
        return { x: "Age (years)", y: "Annual Income ($)" };
      case "education-income":
        return { x: "Education Level", y: "Annual Income ($)" };
      case "distance-emigrants":
        return {
          x: "Distance from Philippines (km)",
          y: "Number of Emigrants",
        };
      default:
        return { x: "Age (years)", y: "Annual Income ($)" };
    }
  };

  const labels = getCurrentLabels();
  const currentData = getCurrentData();

  // Enhanced validation
  const isValidData =
    Array.isArray(currentData) &&
    currentData.length > 0 &&
    currentData.every(
      (series) =>
        series &&
        series.id &&
        Array.isArray(series.data) &&
        series.data.length > 0 &&
        series.data.every(
          (point) =>
            point &&
            typeof point.x !== "undefined" &&
            typeof point.y !== "undefined" &&
            !isNaN(Number(point.x)) &&
            !isNaN(Number(point.y))
        )
    );

  // Calculate total data points for display
  const totalPoints = currentData.reduce(
    (sum, series) => sum + (series.data?.length || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Relationship Analysis
        </h1>
        <p className="text-muted-foreground">
          Explore correlations and relationships between variables using
          scatter charts
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <FilterSelect
          label="Relationship Type"
          value={selectedMetric}
          options={[
            { value: "age-income", label: "Age vs Income" },
            { value: "education-income", label: "Education vs Income" },
            { value: "distance-emigrants", label: "Distance vs Emigrants" },
          ]}
          onChange={setSelectedMetric}
        />
        <div className="flex items-end mt-6">
          <div className="text-sm text-muted-foreground">
            {isValidData && (
              <p className="font-semibold">
                📊 {totalPoints} data point{totalPoints !== 1 ? "s" : ""}{" "}
                available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Scatter Chart */}
      <DashboardCard
        title={
          selectedMetric === "age-income"
            ? "Age vs Income Relationship"
            : selectedMetric === "education-income"
            ? "Education vs Income Relationship"
            : "Distance vs Emigrants Relationship"
        }
      >
        <div style={{ height: '500px' }}>
          {isValidData ? (
            <ResponsiveScatterPlot
            data={currentData}
            margin={{ top: 50, right: 130, bottom: 70, left: 90 }}
            xScale={{ type: "linear", min: "auto", max: "auto" }}
            xFormat=" >-.2f"
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            yFormat=" >-.2f"
            blendMode="multiply"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: labels.x,
              legendPosition: "middle",
              legendOffset: 46,
              format: (value) => {
                // Format large numbers with commas
                if (selectedMetric === "distance-emigrants") {
                  return value.toLocaleString();
                }
                return value;
              },
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: labels.y,
              legendPosition: "middle",
              legendOffset: -70,
              format: (value) => {
                // Format large numbers with commas
                if (typeof value === "number") {
                  return value.toLocaleString();
                }
                return value;
              },
            }}
            colors={{ scheme: "category10" }}
            nodeSize={(node) => {
              // Use the size property if available, otherwise default to 8
              return node.data.size || 8;
            }}
            useMesh={true}
            debugMesh={false}
            enableGridX={true}
            enableGridY={true}
            motionConfig="wobbly"
            tooltip={({ node }) => (
              <div className="bg-card px-3 py-2 rounded-lg border border-border shadow-lg">
                <div className="text-card-foreground font-semibold mb-1">
                  {node.serieId}
                </div>
                <div className="text-muted-foreground text-sm">
                  {labels.x}:{" "}
                  <span className="font-semibold">
                    {Number(node.data.x).toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {labels.y}:{" "}
                  <span className="font-semibold">
                    {Number(node.data.y).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 130,
                translateY: 0,
                itemsSpacing: 5,
                itemDirection: "left-to-right",
                itemWidth: 100,
                itemHeight: 12,
                itemOpacity: 0.85,
                symbolSize: 12,
                symbolShape: "circle",
                itemTextColor: "var(--foreground)",
              },
            ]}
            theme={{
              background: "transparent",
              text: {
                fontSize: 12,
                fill: "var(--muted-foreground)",
              },
              axis: {
                domain: {
                  line: {
                    stroke: "var(--border)",
                    strokeWidth: 1,
                  },
                },
                legend: {
                  text: {
                    fontSize: 14,
                    fill: "var(--muted-foreground)",
                    fontWeight: 600,
                  },
                },
                ticks: {
                  line: {
                    stroke: "var(--border)",
                    strokeWidth: 1,
                  },
                  text: {
                    fontSize: 11,
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
                },
              },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-yellow-400 font-semibold mb-2 text-lg">
                No data available yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {currentData &&
                currentData.length > 0 &&
                currentData[0]?.data?.length === 0
                  ? "Data structure exists but contains no points. This usually means your Firebase collection is empty or the data doesn't match the expected format."
                  : "Please ensure emigrant data has been uploaded to Firebase collections: emigrantData_age, emigrantData_education, and emigrantData_destination"}
              </p>

              <div className="bg-muted/50 rounded-lg border border-border p-4 mt-4">
                <p className="text-sm font-semibold mb-2">
                  💡 Expected Firebase Collections:
                </p>
                <ul className="text-xs text-muted-foreground text-left list-disc list-inside space-y-1">
                  <li>
                    <code className="bg-muted px-1 rounded">
                      emigrantData_age
                    </code>{" "}
                    - Age group data by year
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">
                      emigrantData_education
                    </code>{" "}
                    - Education level data by year
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">
                      emigrantData_destination
                    </code>{" "}
                    - Destination country data by year
                  </li>
                </ul>
              </div>

              {!loading && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </DashboardCard>

      {/* Correlation Matrix */}
      <DashboardCard title="Correlation Matrix">
        {correlationData && correlationData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Metric</th>
                  <th className="text-center py-3 px-4">Correlation</th>
                  <th className="text-center py-3 px-4">Strength</th>
                  <th className="text-center py-3 px-4">Visualization</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{item.metric}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          Math.abs(item.correlation) > 0.7
                            ? "bg-green-600 text-white"
                            : Math.abs(item.correlation) > 0.5
                              ? "bg-yellow-600 text-white"
                              : "bg-red-600 text-white"
                        }`}
                      >
                        {item.correlation.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-muted-foreground">{item.strength}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="w-32 bg-muted rounded-full h-3 mx-auto">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            Math.abs(item.correlation) > 0.7
                              ? "bg-green-500"
                              : Math.abs(item.correlation) > 0.5
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.abs(item.correlation) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📈</div>
            <p>No correlation data available</p>
            <p className="text-sm mt-2">
              Correlation data will appear once relationship data is loaded
            </p>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
