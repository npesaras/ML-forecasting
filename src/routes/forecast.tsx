import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTrendData } from "../hooks/useTrendData";
import { useForecast } from "../hooks/useForecast";
import type { ActivationFunction } from "../ml/forecastModel";
import { saveModelToFirebase } from "../api/modelService";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";

export const Route = createFileRoute("/forecast")({
  component: ForecastPage,
});

type DataType = "destination" | "age";
type ForecastHorizon = 5 | 10;

function ForecastPage() {
  const [dataType, setDataType] = useState<DataType>("destination");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>(10);
  const [lookback, setLookback] = useState<number>(3);
  const [mlpNeurons, setMlpNeurons] = useState<string>("64, 32");
  const [activation, setActivation] = useState<ActivationFunction>("relu");
  const [activation2, setActivation2] = useState<ActivationFunction>("relu");

  const { countryTrends, ageGroupTrends, loading, error, countries, ageGroups } =
    useTrendData();
  const forecast = useForecast();

  // Get available items based on data type
  const availableItems =
    dataType === "destination" ? countries : ageGroups;

  // Set default item when data loads or type changes
  useEffect(() => {
    if (!selectedItem && availableItems.length > 0) {
      setSelectedItem(availableItems[0]);
    }
  }, [availableItems, selectedItem]);

  // Get selected trend data
  const selectedTrendData = useMemo(() => {
    const trends =
      dataType === "destination" ? countryTrends : ageGroupTrends;
    const trend = trends.find((t) => t.id === selectedItem);
    if (!trend) return [];

    return trend.data.map((d) => ({
      year: parseInt(d.x),
      value: d.y,
    }));
  }, [dataType, selectedItem, countryTrends, ageGroupTrends]);

  // Prepare chart data (combine historical + forecast)
  const chartData = useMemo(() => {
    const historical = selectedTrendData.map((d) => ({
      year: d.year.toString(),
      actual: d.value,
      forecast: null,
    }));

    const forecastPoints = forecast.state.forecasts.map((f) => ({
      year: f.year.toString(),
      actual: null,
      forecast: f.value,
    }));

    return [...historical, ...forecastPoints];
  }, [selectedTrendData, forecast.state.forecasts]);

  // Prepare moving averages for chart
  const movingAverageData = useMemo(() => {
    const result: any[] = [];

    selectedTrendData.forEach((d) => {
      const entry: any = { year: d.year.toString() };

      if (forecast.state.movingAverages.MA3) {
        const ma3 = forecast.state.movingAverages.MA3.find(
          (m) => m.year === d.year
        );
        if (ma3) entry.ma3 = ma3.value;
      }

      if (forecast.state.movingAverages.MA5) {
        const ma5 = forecast.state.movingAverages.MA5.find(
          (m) => m.year === d.year
        );
        if (ma5) entry.ma5 = ma5.value;
      }

      if (forecast.state.movingAverages.MA10) {
        const ma10 = forecast.state.movingAverages.MA10.find(
          (m) => m.year === d.year
        );
        if (ma10) entry.ma10 = ma10.value;
      }

      result.push(entry);
    });

    return result;
  }, [selectedTrendData, forecast.state.movingAverages]);

  const handleTrain = async () => {
    if (selectedTrendData.length < 6) {
      alert("Need at least 6 data points to train the model");
      return;
    }

    // Parse MLP neurons
    const hiddenLayers = mlpNeurons
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (hiddenLayers.length === 0) {
      alert("Invalid MLP neurons format. Use comma-separated numbers (e.g., 64, 32)");
      return;
    }

    await forecast.trainModel(selectedTrendData, {
      windowSize: lookback,
      hiddenLayers,
      activation,
      activation2,
    });
  };

  const handleForecast = async () => {
    if (!forecast.state.isTrained) {
      alert("Please train the model first");
      return;
    }

    const lastYear = selectedTrendData[selectedTrendData.length - 1].year;
    await forecast.generateForecast(forecastHorizon, lastYear + 1);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading data...</div>
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
          ML Forecasting
        </h1>
        <p className="text-muted-foreground">
          Time Series Forecasting using Multi-Layer Perceptron (MLP)
        </p>
      </div>

      {/* Controls */}
      <DashboardCard title="Configuration">
        {/* Data Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Data Type */}
          <FilterSelect
            label="Data Type"
            value={dataType}
            options={[
              { value: "destination", label: "Destination Country" },
              { value: "age", label: "Age Group" },
            ]}
            onChange={(val) => {
              setDataType(val as DataType);
              setSelectedItem("");
              forecast.reset();
            }}
          />

          {/* Selected Item */}
          <FilterSelect
            label={dataType === "destination" ? "Country" : "Age Group"}
            value={selectedItem}
            options={availableItems.map((item) => ({ value: item, label: item }))}
            onChange={(val) => {
              setSelectedItem(val);
              forecast.reset();
            }}
          />

          {/* Forecast Horizon */}
          <FilterSelect
            label="Forecast Horizon (Years)"
            value={forecastHorizon}
            options={[
              { value: 5, label: "5 Years" },
              { value: 10, label: "10 Years" },
            ]}
            onChange={(val) =>
              setForecastHorizon(Number(val) as ForecastHorizon)
            }
          />
        </div>

        {/* Model Hyperparameters */}
        <div className="border-t border-border pt-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">Model Hyperparameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lookback */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Lookback (Window Size)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={lookback}
                onChange={(e) => setLookback(parseInt(e.target.value) || 3)}
                className="w-full p-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>

            {/* MLP Neurons */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                MLP Neurons (Units)
              </label>
              <input
                type="text"
                value={mlpNeurons}
                onChange={(e) => setMlpNeurons(e.target.value)}
                placeholder="64, 32"
                className="w-full p-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>

            {/* Activation Function Layer 1 */}
            <FilterSelect
              label="Activation (Layer 1)"
              value={activation}
              options={[
                { value: "relu", label: "ReLU" },
                { value: "elu", label: "ELU" },
                { value: "tanh", label: "Tanh" },
                { value: "sigmoid", label: "Sigmoid" },
              ]}
              onChange={(val) => setActivation(val as ActivationFunction)}
            />

            {/* Activation Function Layer 2 */}
            <FilterSelect
              label="Activation (Layer 2)"
              value={activation2}
              options={[
                { value: "relu", label: "ReLU" },
                { value: "elu", label: "ELU" },
                { value: "tanh", label: "Tanh" },
                { value: "sigmoid", label: "Sigmoid" },
              ]}
              onChange={(val) => setActivation2(val as ActivationFunction)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleTrain}
            disabled={forecast.state.isTraining || selectedTrendData.length < 6}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {forecast.state.isTraining ? "Training..." : "Train Model"}
          </button>
          <button
            onClick={handleForecast}
            disabled={
              !forecast.state.isTrained ||
              forecast.state.isForecasting ||
              forecast.state.isTraining
            }
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {forecast.state.isForecasting
              ? "Forecasting..."
              : "Generate Forecast"}
          </button>
          <button
            onClick={async () => {
              if (!forecast.state.metrics) {
                alert("No trained model to save");
                return;
              }

              try {
                const modelName = `${dataType}_${selectedItem}_${new Date().toISOString()}`;

                // Parse MLP neurons for config
                const hiddenLayers = mlpNeurons
                  .split(",")
                  .map((n) => parseInt(n.trim()))
                  .filter((n) => !isNaN(n) && n > 0);

                // Save to Firebase
                const modelId = await saveModelToFirebase({
                  name: modelName,
                  dataType,
                  selectedItem,
                  config: {
                    windowSize: lookback,
                    epochs: 100, // default value
                    batchSize: 8, // default value
                    learningRate: 0.001, // default value
                    hiddenLayers,
                    activation,
                    activation2,
                    validationSplit: 0.2, // default value
                  },
                  metrics: forecast.state.metrics,
                  modelWeights: "", // Placeholder - TensorFlow.js models are complex to serialize
                  createdAt: new Date(),
                });

                alert(`Model saved to Firebase!\nID: ${modelId}\nName: ${modelName}`);
              } catch (error) {
                console.error("Error saving model:", error);
                alert(`Failed to save model: ${error instanceof Error ? error.message : "Unknown error"}`);
              }
            }}
            disabled={!forecast.state.isTrained}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Model to Firebase
          </button>
          <button
            onClick={forecast.reset}
            disabled={forecast.state.isTraining || forecast.state.isForecasting}
            className="px-6 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Error Message */}
        {forecast.state.error && (
          <div className="mt-4">
            <ErrorAlert title="Error" message={forecast.state.error} />
          </div>
        )}
      </DashboardCard>

      {/* Metrics Cards */}
      {forecast.state.isTrained && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Training Loss */}
            {forecast.state.metrics && (
              <>
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs">MAE</p>
                  <p className="text-xl font-bold">
                    {forecast.state.metrics.mae.toFixed(2)}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs">RMSE</p>
                  <p className="text-xl font-bold">
                    {forecast.state.metrics.rmse.toFixed(2)}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs">MAPE</p>
                  <p className="text-xl font-bold">
                    {forecast.state.metrics.mape.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs">R²</p>
                  <p className="text-xl font-bold">
                    {forecast.state.metrics.r2.toFixed(4)}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                  <p className="text-muted-foreground text-xs">Accuracy</p>
                  <p className="text-xl font-bold text-green-500">
                    {forecast.state.metrics.accuracy.toFixed(2)}%
                  </p>
                </div>
              </>
            )}

            {/* CAGR */}
            <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
              <p className="text-muted-foreground text-xs">CAGR</p>
              <p className="text-xl font-bold">
                {forecast.state.cagr.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Model Configuration */}
          <DashboardCard title="Trained Model Configuration">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Lookback</p>
                <p className="font-semibold">{lookback}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MLP Neurons</p>
                <p className="font-semibold">{mlpNeurons}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Activation L1</p>
                <p className="font-semibold">{activation.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Activation L2</p>
                <p className="font-semibold">{activation2.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Points</p>
                <p className="font-semibold">{selectedTrendData.length}</p>
              </div>
            </div>
          </DashboardCard>
        </>
      )}

      {/* Main Chart */}
      <DashboardCard
        title={`Time Series Forecast - ${selectedItem}`}
      >
        <div style={{ width: "100%", height: 500 }}>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 50, left: 80, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="year"
                stroke="var(--muted-foreground)"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                width={80}
                label={{
                  value: "Emigrants",
                  angle: -90,
                  position: "insideLeft",
                  fill: "var(--foreground)",
                }}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Historical"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Forecast"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      {/* Moving Averages Chart */}
      {forecast.state.isTrained &&
        Object.keys(forecast.state.movingAverages).length > 0 && (
          <DashboardCard title="Moving Averages">
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={movingAverageData}
                  margin={{ top: 20, right: 50, left: 80, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="year"
                    stroke="var(--muted-foreground)"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    width={80}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ma3"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    name="3-Year MA"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma5"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    name="5-Year MA"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma10"
                    stroke="var(--chart-5)"
                    strokeWidth={2}
                    name="10-Year MA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        )}
    </div>
  );
}
