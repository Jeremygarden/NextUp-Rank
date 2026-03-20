import React from 'react'
import ReactDOM from 'react-dom/client'
import PerformancePulseGraph from '../ui/PerformancePulseGraph'
import './index.css'

const App = () => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
    <div className="w-full max-w-4xl">
      <PerformancePulseGraph />
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
