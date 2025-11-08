import React, { useState } from "react";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import alertsData from "@/pages/datafiles/alerts.json";
import { Sidebar } from "@/components/layout/Sidebar";

type Rule = {
  category: string;
  rules: string[];
};

const COLORS = ["#4ded30", "#9d40eeff", "#FF3AAE", "#00BFFF", "#FF0800", "#f37b0bff", "#FFE200"];

const AlertRules: React.FC = () => {
  // Sites dropdown state
  const [selectedSite, setSelectedSite] = useState(Object.keys(alertsData.sites)[0]);
  const { alertRules, sites } = alertsData;
  const datasets = sites[selectedSite].datasets;

  // Metric dropdown state
  const [selectedMetric, setSelectedMetric] = useState(Object.keys(datasets)[0]);

  // Function to get units
  const getUnit = (metric: string) => {
    switch(metric){
      case "Wind Speed" :
        return "km/h";
      case "Battery Charge":
        return "%";
      case "Antenna Signal":
        return "dBm";
      case "Solar Output":
        return "kW";
      case "Tower Tilt":
        return "°";
      case "Equipment Temp":
        return "℃";
      case "Motion Detection":
        return "m";
      default:
        return "";
    }
  };

  // Generate dynamic donut data from datasets
  const dynamicDonutData = Object.keys(datasets).map((metric, index) => {
    const dataPoints = datasets[metric];
    const totalAlerts = dataPoints.reduce((acc, point) => {
      let isAlert = false;
      if (metric === "Battery Charge" || metric === "Motion Detection") {
        isAlert = point.value < point.threshold;
      } else if (metric === "Antenna Signal") {
        isAlert = point.value < point.threshold * 0.7;
      } else {
        isAlert = point.value > point.threshold;
      }
      return acc + (isAlert ? 1 : 0);
    }, 0);

    return {
      category: metric,
      alerts: totalAlerts
    };
  });

  return (
  <div className="flex h-screen overflow-hidden">
    <div className="w-64">
      <Sidebar/>
    </div>
    <div style={styles.container} className="flex-1 overflow-y-auto p-2">
      <h1 style={styles.title}>📡 Digital Twin Telecom Tower – Alert Rules</h1>

      {/* Site Selector */}
      <div style={{ marginBottom: "0.5rem", textAlign: "center" }}>
        <label style={{ marginRight: "0.5rem", fontWeight: "bold" }}>Select Site:</label>
        <select
          style={styles.select}
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          {Object.keys(sites).map((site) => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
      </div>

      {/* Site Name Heading */}
      <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#333" }}>
        {selectedSite}
      </h2>

      {/* Charts Flex Container */}
      <div style={styles.chartsRow}>
        {/* Pie Chart */}
        <div style={{ ...styles.chartBox, flex: 1, minWidth: 300 }}>
          <h3 style={styles.chartTitle}>Alert Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dynamicDonutData}
                dataKey="alerts"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {dynamicDonutData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value:number, name:string) => [`${value} Alerts`, name]} />
              <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle"
                formatter={(value) => <span style={{ fontSize: "0.9rem" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div style={{ ...styles.chartBox, flex: 2, minWidth: 400 }}>
          <h3 style={styles.chartTitle}>{selectedMetric} vs Threshold</h3>
          <select
            style={styles.select}
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            {Object.keys(datasets).map((metric) => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datasets[selectedMetric]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1a73e8"
                name={selectedMetric}
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if(!cx || !cy) return null;
                  let showAlert = false;
                  if (selectedMetric === "Battery Charge" || selectedMetric === "Motion Detection"){
                    showAlert = payload.value < payload.threshold;
                  } else if (selectedMetric === "Antenna Signal"){
                    showAlert = payload.value < payload.threshold*0.7;
                  } else {
                    showAlert = payload.value > payload.threshold;
                  }

                  if (showAlert){
                    return(
                      <text
                        x={cx}
                        y={cy - 10}
                        fill="red"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontSize={22}
                      >
                        ❗
                      </text>
                    );
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="#1a73e8" />
                }}
              />
              <Line
                type="monotone"
                dataKey="threshold"
                stroke="green"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Threshold"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={styles.thresholdInfo}>
            <strong>Threshold:</strong>{" "}
            {datasets[selectedMetric][0]?.threshold} {getUnit(selectedMetric)}
          </div>
        </div>
      </div>

      {/* Alert Rules */}
      {alertRules.map((section, index) => (
        <div key={index} style={styles.section}>
          <h2 style={styles.category}>{section.category}</h2>
          <ul>
            {section.rules.map((rule, i) => (
              <li key={i} style={styles.rule}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1330px",
    margin: "0rem auto",
    fontFamily: "Arial, sans-serif",
    marginRight: "0rem"
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center" as const,
    color: "#2c3e50",
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    marginBottom: "2rem",
  },
  chartBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  chartTitle: {
    textAlign: "center" as const,
    marginBottom: "1rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  select: {
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "1rem",
  },
  thresholdInfo: {
    marginTop: "0.5rem",
    textAlign: "center" as const,
    fontSize: "0.9rem",
    color: "#555",
    fontStyle: "italic",
  },
  section: {
    marginBottom: "2rem",
  },
  category: {
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
    color: "#1a73e8",
  },
  rule: {
    marginBottom: "0.25rem",
    lineHeight: "1.6",
  },
};

export default AlertRules;
