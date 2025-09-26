import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Users, Shield, MapPin, TrendingUp, Calendar, Plus } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBatches: 0,
    sealedBatches: 0,
    inTransit: 0,
    totalVolume: 0,
    totalProducers: 0,
    totalCheckpoints: 0,
    recentBatches: []
  })

  useEffect(() => {
    const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
    const producersDB = JSON.parse(localStorage.getItem('producersDB') || '[]')
    
    const totalCheckpoints = batchesDB.reduce((sum, batch) => sum + batch.checkpoints.length, 0)
    const totalVolume = batchesDB.reduce((sum, batch) => sum + parseFloat(batch.totalQuantity), 0)
    
    setStats({
      totalBatches: batchesDB.length,
      sealedBatches: batchesDB.filter(b => b.sealed).length,
      inTransit: batchesDB.filter(b => b.status === 'Em trânsito').length,
      totalVolume: totalVolume,
      totalProducers: producersDB.length,
      totalCheckpoints: totalCheckpoints,
      recentBatches: batchesDB
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    })
  }, [])

  function getStatusColor(status) {
    switch (status) {
      case 'Entregue': return 'bg-green-100 text-green-800'
      case 'Em trânsito': return 'bg-blue-100 text-blue-800'
      case 'Selado': return 'bg-purple-100 text-purple-800'
      case 'Criado': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard de Rastreabilidade
              </h1>
              <p className="text-gray-600">Visão geral do sistema de lotes e rastreamento</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to="/batch/create"
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Lote
              </Link>
            </div>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lotes</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalBatches}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/batches" className="text-sm text-indigo-600 hover:text-indigo-800">
                Ver todos os lotes →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lotes Selados</p>
                <p className="text-3xl font-bold text-purple-600">{stats.sealedBatches}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {stats.totalBatches > 0 ? Math.round((stats.sealedBatches / stats.totalBatches) * 100) : 0}% do total
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Trânsito</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inTransit}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                Lotes ativos no transporte
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volume Total</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalVolume.toFixed(1)}t</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                Toneladas processadas
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Produtores Cadastrados
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{stats.totalProducers}</div>
              <p className="text-gray-600">Produtores no sistema</p>
              <div className="mt-4">
                <Link to="/batch/create" className="text-sm text-indigo-600 hover:text-indigo-800">
                  Cadastrar novo produtor →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
              Checkpoints Registrados
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalCheckpoints}</div>
              <p className="text-gray-600">Pontos de controle</p>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  Média: {stats.totalBatches > 0 ? (stats.totalCheckpoints / stats.totalBatches).toFixed(1) : 0} por lote
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lotes Recentes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Lotes Recentes
            </h3>
            <Link to="/batches" className="text-sm text-indigo-600 hover:text-indigo-800">
              Ver todos →
            </Link>
          </div>

          {stats.recentBatches.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-600 mb-2">Nenhum lote criado</h4>
              <p className="text-gray-500 mb-6">Crie seu primeiro lote para começar o rastreamento</p>
              <Link
                to="/batch/create"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Lote
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentBatches.map(batch => (
                <div key={batch.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-gray-900">{batch.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.sealed && <Shield className="w-3 h-3 inline mr-1" />}
                        {batch.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{batch.product} • {batch.totalQuantity}t</span>
                      <span>{batch.producers.length} produtores</span>
                      <span>{new Date(batch.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/public/batch/${batch.id}`}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      🌍 Público
                    </Link>
                    <Link
                      to={`/batch/${batch.id}`}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}