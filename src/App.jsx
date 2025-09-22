import { Routes, Route, Link } from 'react-router-dom'
import ProductForm from './pages/ProductForm'
import LicensePage from './pages/LicensePage'
import TrackingPage from './pages/TrackingPage'

export default function App(){ 
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-bold">Sistema de Rastreamento</h1>
          <nav className="flex gap-4">
            <Link to="/" className="underline">Cadastrar</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<ProductForm />} />
          <Route path="/license/:id" element={<LicensePage />} />
          <Route path="/track/:id" element={<TrackingPage />} />
        </Routes>
      </main>
    </div>
  )
}
