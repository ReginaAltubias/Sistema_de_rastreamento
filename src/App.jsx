import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProductForm from './pages/ProductForm'
import LicensePage from './pages/LicensePage'
import TrackingPage from './pages/TrackingPage'
import BatchForm from './pages/BatchForm'
import BatchTracking from './pages/BatchTracking'
import BatchList from './pages/BatchList'
import PublicBatch from './pages/PublicBatch'

export default function App(){ 
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-bold">Sistema de Rastreamento</h1>
          <nav className="flex gap-4">
            <Link to="/" className="underline">Dashboard</Link>
            <Link to="/batches" className="underline">Lotes</Link>
            <Link to="/batch/create" className="underline">Criar Lote</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductForm />} />
          <Route path="/license/:id" element={<LicensePage />} />
          <Route path="/track/:id" element={<TrackingPage />} />
          <Route path="/batches" element={<BatchList />} />
          <Route path="/batch/create" element={<BatchForm />} />
          <Route path="/batch/:id" element={<BatchTracking />} />
          <Route path="/public/batch/:id" element={<PublicBatch />} />
        </Routes>
      </main>
    </div>
  )
}
