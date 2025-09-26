import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Users, Shield, Plus, Search, Calendar, MapPin } from 'lucide-react'

export default function BatchList() {
  const [batches, setBatches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
    setBatches(batchesDB.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  }, [])

  function getStatusColor(status) {
    switch (status) {
      case 'Entregue': return 'bg-green-100 text-green-800 border-green-200'
      case 'Em trânsito': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Selado': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Criado': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.product.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || batch.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Package className="w-8 h-8 mr-3 text-indigo-600" />
                Lotes de Exportação
              </h1>
              <p className="text-gray-600">Gerencie e acompanhe todos os lotes criados</p>
            </div>
            
            <Link
              to="/batch/create"
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Novo Lote
            </Link>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou produto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="Criado">Criado</option>
                <option value="Selado">Selado</option>
                <option value="Em trânsito">Em trânsito</option>
                <option value="Entregue">Entregue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Lotes */}
        <div className="space-y-4">
          {filteredBatches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {batches.length === 0 ? 'Nenhum lote criado' : 'Nenhum lote encontrado'}
              </h3>
              <p className="text-gray-500 mb-6">
                {batches.length === 0 
                  ? 'Crie seu primeiro lote de exportação para começar o rastreamento'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {batches.length === 0 && (
                <Link
                  to="/batch/create"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Lote
                </Link>
              )}
            </div>
          ) : (
            filteredBatches.map(batch => (
              <div key={batch.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{batch.name}</h3>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getStatusColor(batch.status)} text-sm font-medium`}>
                          {batch.sealed && <Shield className="w-3 h-3 mr-1" />}
                          {batch.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-indigo-500" />
                          <span>{batch.product} • {batch.totalQuantity}t</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-indigo-500" />
                          <span>{batch.producers.length} produtores</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                          <span>{new Date(batch.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                          <span>{batch.checkpoints.length} checkpoints</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-xs text-gray-500">Código: </span>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {batch.batchCode}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/public/batch/${batch.id}`}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        🌍 Ver Público
                      </Link>
                      <Link
                        to={`/batch/${batch.id}`}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Estatísticas */}
        {batches.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{batches.length}</div>
              <div className="text-sm text-gray-600">Total de Lotes</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {batches.filter(b => b.sealed).length}
              </div>
              <div className="text-sm text-gray-600">Lotes Selados</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {batches.filter(b => b.status === 'Em trânsito').length}
              </div>
              <div className="text-sm text-gray-600">Em Trânsito</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {batches.reduce((sum, b) => sum + parseFloat(b.totalQuantity), 0).toFixed(1)}t
              </div>
              <div className="text-sm text-gray-600">Volume Total</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}