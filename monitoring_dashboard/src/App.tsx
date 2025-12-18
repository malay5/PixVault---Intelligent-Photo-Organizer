import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  Activity,
  Server,
  Database,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Users,
  Image as ImageIcon
} from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:5000/api/dashboard';

function App() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [statsRes, healthRes, latencyRes] = await Promise.all([
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/health`),
        axios.get(`${API_URL}/latency`)
      ]);

      setStats(statsRes.data);
      setHealth(healthRes.data);
      setLatencyData(latencyRes.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return <div className="flex items-center justify-center h-screen bg-gray-100">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Activity className="text-blue-600" />
            PixelVault Monitor
          </h1>
          <p className="text-gray-500 mt-1">System Health & AI Performance</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
          <Clock size={16} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </header>

      {/* Service Health */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wider text-xs">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard name="Backend API" status={health?.backend} icon={<Server size={20} />} />
          <HealthCard name="Database" status={health?.database} icon={<Database size={20} />} />
          <HealthCard name="ML Service" status={health?.ml_service} icon={<Cpu size={20} />} />
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 uppercase tracking-wider text-xs">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Photos"
            value={stats?.photos?.toLocaleString()}
            icon={<ImageIcon className="text-blue-500" />}
          />
          <StatCard
            title="Users"
            value={stats?.users?.toLocaleString()}
            icon={<Users className="text-purple-500" />}
          />
          <StatCard
            title="Storage Used"
            value={formatBytes(stats?.storage_bytes)}
            icon={<HardDrive className="text-gray-500" />}
          />
          <StatCard
            title="Reported Issues"
            value={stats?.reported_issues}
            icon={<AlertTriangle className="text-red-500" />}
            alert={stats?.reported_issues > 0}
          />
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Latency Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            System Latency (ms)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#6b7280' }}
                />
                <Area type="monotone" dataKey="avg_latency" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Performance / Placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Cpu size={20} className="text-purple-500" />
            AI Processing Activity
          </h3>
          <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800 mb-2">{stats?.processed_images?.toLocaleString() ?? 0}</p>
              <p className="text-gray-500 text-sm uppercase tracking-wide">Images Processed</p>
            </div>
            <div className="mt-8 w-full max-w-xs bg-gray-200 rounded-full h-2.5 dark:bg-gray-200">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Daily Quota Usage (Mock)</p>
          </div>
        </div>

      </div>
    </div>
  )
}

function HealthCard({ name, status, icon }: any) {
  const isHealthy = status === 'healthy';
  const isDegraded = status === 'degraded';

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-50 text-green-600' : isDegraded ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
          {icon}
        </div>
        <span className="font-medium text-gray-700">{name}</span>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${isHealthy ? 'bg-green-100 text-green-700' :
          isDegraded ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'}`}>
        {status || 'Unknown'}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, alert }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 transition-all ${alert ? 'border-red-500' : 'border-transparent hover:border-blue-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
          <div className="mt-2 text-2xl font-bold text-gray-900">{value ?? '-'}</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
          {icon}
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default App
