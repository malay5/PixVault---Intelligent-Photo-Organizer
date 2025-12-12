import { useState } from 'react'
import './App.css'

function App() {
  // Mock Stats
  const [stats] = useState({
    totalUploads: 12453,
    uploadedToday: 142,
    misclassified: 87,
    activeModel: "FaceNet_v2 (B)",
    abTestStatus: "Running"
  })

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">PixelVault Monitoring</h1>
        <p className="text-gray-600">Real-time system statistics & ML Performance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Total Uploads" value={stats.totalUploads.toLocaleString()} color="bg-blue-500" />
        <Card title="Uploaded Today" value={stats.uploadedToday} color="bg-green-500" />
        <Card title="Misclassified Faces" value={stats.misclassified} color="bg-red-500" />
        <Card title="A/B Test" value={stats.activeModel} sub={stats.abTestStatus} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Classification Accuracy (Last 24h)</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <span className="text-gray-400">Chart Placeholder</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Corrections (HITL)</h2>
          <ul className="space-y-3">
            {[1, 2, 3].map(i => (
              <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Face #3928 re-labeled as "John"</span>
                <span className="text-xs text-gray-400">2m ago</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Card({ title, value, sub, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-transparent hover:border-blue-500 transition-all">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className={`text-sm mt-1 font-medium ${sub === 'Running' ? 'text-green-600' : 'text-gray-500'}`}>{sub}</div>}
    </div>
  )
}

export default App
