import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Defaults - Premium Glassmorphism Theme
ChartJS.defaults.color = "rgba(255, 255, 255, 0.5)";
ChartJS.defaults.font.family = "'Outfit', sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = "rgba(15, 15, 15, 0.8)";
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.cornerRadius = 12;
ChartJS.defaults.plugins.tooltip.displayColors = true;

export const CHART_COLORS = {
  primary: "rgba(99, 102, 241, 1)",      // Indigo
  primaryLight: "rgba(99, 102, 241, 0.2)",
  success: "rgba(52, 211, 153, 1)",      // Emerald
  successLight: "rgba(52, 211, 153, 0.2)",
  danger: "rgba(248, 113, 113, 1)",       // Rose
  dangerLight: "rgba(248, 113, 113, 0.2)",
  warning: "rgba(251, 191, 36, 1)",      // Amber
  info: "rgba(56, 189, 248, 1)",         // Sky
};

export const CHART_GRADIENTS = {
  primary: (ctx: any) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
    return gradient;
  }
};
