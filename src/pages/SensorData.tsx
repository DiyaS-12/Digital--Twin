import React, { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Chart } from "react-google-charts";
import { Sidebar } from "@/components/layout/Sidebar";
import { useQuery } from "@apollo/client/react";
import {
  GET_FUEL_DATA_BY_DATE,
  GET_RAINFALL_DATA_BY_DATE,
  GET_TEMPERATURE_DATA_BY_DATE,
} from "@/graphql/queries";

interface FuelData {
  date: string;
  percentage: number;
}
interface RainfallData {
  date: string;
  mm: number;
}
interface TemperatureData {
  timestamp: string;
  temperature: number;
  humidity: number;
}

const Thermometer = ({ value }: { value: number }) => {
  const data = [["Label", "Value"], ["Temp", value]];
  const options = {
    min: 0,
    max: 50,
    yellowFrom: 30,
    yellowTo: 40,
    redFrom: 40,
    redTo: 50,
    minorTicks: 5,
    majorTicks: ["0", "10", "20", "30", "40", "50"],
  };
  return (
    <Chart
      chartType="Gauge"
      width="100%"
      height="250px"
      data={data}
      options={options}
    />
  );
};

const SensorDataPage: React.FC = () => {
  // Shared date picker for Fuel & Rainfall
  const [mainDate, setMainDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Separate for temperature
  const [tempDate, setTempDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tempTime, setTempTime] = useState<string>("");

  // GraphQL Queries
  const { data: fuelData } = useQuery<{
    fuel_dataCollection: { edges: { node: FuelData }[] };
  }>(GET_FUEL_DATA_BY_DATE, { variables: { date: mainDate } });

  const { data: rainData } = useQuery<{
    rainfall_dataCollection: { edges: { node: RainfallData }[] };
  }>(GET_RAINFALL_DATA_BY_DATE, { variables: { date: mainDate } });

  const { data: tempData } = useQuery<{
    temperature_dataCollection: { edges: { node: TemperatureData }[] };
  }>(GET_TEMPERATURE_DATA_BY_DATE, { variables: { date: tempDate } });

  // Values for fuel & rainfall
  const fuelRecord = fuelData?.fuel_dataCollection?.edges?.[0]?.node;
  const rainfallRecord = rainData?.rainfall_dataCollection?.edges?.[0]?.node;
  const rainfallValue = rainfallRecord?.mm ?? 0;
  const fuelValue = fuelRecord?.percentage ?? 0;

  // Temperature & Humidity
  const tempRecords =
    tempData?.temperature_dataCollection?.edges?.map((e) => e.node) ?? [];
  const availableTimes = tempRecords.map((t) => t.timestamp.split(" ")[1]);

  // Auto-select first available time
  useEffect(() => {
    if (availableTimes.length > 0) {
      setTempTime(availableTimes[0]);
    } else {
      setTempTime("");
    }
  }, [tempDate, tempData]);

  const currentTempRecord = tempRecords.find(
    (t) => t.timestamp === `${tempDate} ${tempTime}`
  );
  const tempValue = currentTempRecord?.temperature ?? 0;
  const humidityValue = currentTempRecord?.humidity ?? 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 bg-gray-900 text-white">
        <Sidebar />
      </div>

      <div
        className="flex-1 overflow-y-auto bg-gray-50 p-8"
        style={styles.container}
      >
        <h1 style={styles.title}>📊 Live Site Sensor Dashboard (GraphQL)</h1>

        {/* 📅 Shared Date for Rainfall & Fuel */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h3 style={styles.chartTitle}>📅 Select Date (for Rainfall & Fuel)</h3>
          <DatePicker
            selected={new Date(mainDate)}
            onChange={(date: Date) =>
              setMainDate(date.toISOString().split("T")[0])
            }
            dateFormat="yyyy-MM-dd"
            className="date-picker"
          />
        </div>

        {/* 🌧 & ⛽ Charts in one row */}
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
          {/* 🌧 Rainfall */}
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitle}>🌧 Rainfall</h3>
            <GaugeChart
              id="rainfall-gauge"
              nrOfLevels={20}
              colors={["#fdd835", "#1976d2"]}
              percent={Math.min(rainfallValue / 200, 1)}
              textColor="#333"
              formatTextValue={() => `${rainfallValue} mm`}
            />
            <p style={styles.valueText}>{rainfallValue} mm</p>
          </div>

          {/* ⛽ Fuel */}
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitle}>⛽ Fuel Level</h3>
            <GaugeChart
              id="fuel-gauge"
              nrOfLevels={20}
              colors={["#d32f2f", "#388e3c"]}
              percent={Math.min(fuelValue / 100, 1)}
              textColor="#333"
              formatTextValue={() => `${fuelValue}%`}
            />
            <p style={styles.valueText}>{fuelValue}%</p>
          </div>
        </div>

        {/* 🌡 Temperature & 💧 Humidity */}
        <div style={{ ...styles.chartBox, width: "50%" }}>
          <h3 style={styles.chartTitle}>🌡 Temperature & 💧 Humidity</h3>

          {/* 📅 Date + 🕒 Time in one line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <DatePicker
              selected={new Date(tempDate)}
              onChange={(date: Date) =>
                setTempDate(date.toISOString().split("T")[0])
              }
              dateFormat="yyyy-MM-dd"
              className="date-picker"
            />

            {availableTimes.length > 0 && (
              <select
                style={{
                  ...styles.select,
                  display: "inline-block",
                  minWidth: "150px",
                  backgroundColor: "#fff",
                }}
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
              >
                {availableTimes.map((time, i) => (
                  <option key={i} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={styles.dualCharts}>
            <div style={styles.gaugeBox}>
              <Thermometer value={tempValue} />
              <p style={styles.valueText}>{tempValue}℃</p>
            </div>
            <div style={styles.gaugeBox}>
              <GaugeChart
                id="humidity-gauge"
                nrOfLevels={20}
                colors={["#bbdefb", "#0d47a1"]}
                percent={Math.min(humidityValue / 100, 1)}
                textColor="#333"
                formatTextValue={() => `${humidityValue}%`}
              />
              <p style={styles.valueText}>{humidityValue}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "2rem",
  },
  title: {
    width: "100%",
    textAlign: "center" as const,
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  chartBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    textAlign: "center" as const,
    width: "400px",
  },
  chartTitle: {
    marginBottom: "1rem",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#444",
  },
  select: {
    marginBottom: "1rem",
    padding: "0.4rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  valueText: {
    marginTop: "1rem",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#222",
  },
  dualCharts: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1rem",
  },
  gaugeBox: {
    flex: 1,
    textAlign: "center" as const,
  },
};

export default SensorDataPage;
