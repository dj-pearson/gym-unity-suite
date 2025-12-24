/**
 * Lazy-loaded chart dashboard wrapper
 * Reduces initial bundle size by loading chart libraries only when needed
 *
 * Usage: Import from this file instead of directly from recharts
 * This ensures charts are code-split into the vendor-charts chunk
 */
import { Skeleton } from '@/components/ui/skeleton';

// Chart loading skeleton
export const ChartLoader = ({ height = 300, className = '' }: { height?: number; className?: string }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Re-export all Recharts components
// Vite will automatically code-split these into the vendor-charts chunk
export {
  PieChart,
  AreaChart,
  LineChart,
  BarChart,
  RadarChart,
  ScatterChart,
  ComposedChart,
  Area,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  RadialBarChart,
  RadialBar,
  Treemap,
  Funnel,
  FunnelChart,
} from 'recharts';
