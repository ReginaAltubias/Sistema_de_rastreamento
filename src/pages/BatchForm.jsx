import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Users, Plus, X } from 'lucide-react'

export default function BatchForm() {
  const [batchName, setBatchName] = useState('')
  const [product, setProduct] = useState('')
  const [totalQuantity, setTotalQuantity] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [modoTransporte, setModoTransporte] = useState('Carro')
  const [selectedProducers, setSelectedProducers] = useState([])
  const [producers, setProducers] = useState([])
  const [newProducer, setNewProducer] = useState({ name: '', location: '', quantity: '' })
  const [showAddProducer, setShowAddProducer] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedProducers = JSON.parse(localStorage.getItem('producersDB') || '[]')
    setProducers(savedProducers)
  }, [])

  function addProducer() {
    if (!newProducer.name || !newProducer.location || !newProducer.quantity) return
    
    const producer = {
      id: Date.now().toString(),
      ...newProducer,
      quantity: parseFloat(newProducer.quantity)
    }
    
    const updatedProducers = [...producers, producer]
    setProducers(updatedProducers)
    localStorage.setItem('producersDB', JSON.stringify(updatedProducers))
    setNewProducer({ name: '', location: '', quantity: '' })
    setShowAddProducer(false)
  }

  function toggleProducer(producer) {
    const isSelected = selectedProducers.find(p => p.id === producer.id)
    if (isSelected) {
      setSelectedProducers(selectedProducers.filter(p => p.id !== producer.id))
    } else {
      setSelectedProducers([...selectedProducers, producer])
    }
  }

  function generateBatchCode() {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `LOTE-${year}-${timestamp}`
  }

  function generateSubCodes(batchCode, producers) {
    return producers.map((producer, index) => ({
      ...producer,
      subCode: `${batchCode.split('-')[2]}-${String.fromCharCode(65 + index)}`
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (selectedProducers.length === 0) {
      alert('Selecione pelo menos um produtor')
      return
    }

    const batchCode = generateBatchCode()
    const producersWithSubCodes = generateSubCodes(batchCode, selectedProducers)
    const calculatedTotal = selectedProducers.reduce((sum, p) => sum + p.quantity, 0)

    const batch = {
      id: Date.now().toString(),
      batchCode,
      name: batchName,
      product,
      totalQuantity: totalQuantity || calculatedTotal,
      origin,
      destination,
      modoTransporte,
      producers: producersWithSubCodes,
      createdAt: new Date().toISOString(),
      status: 'Criado',
      checkpoints: [],
      sealed: false
    }

    const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
    batchesDB.push(batch)
    localStorage.setItem('batchesDB', JSON.stringify(batchesDB))
    
    navigate(`/batch/${batch.id}`)
  }

  const totalSelected = selectedProducers.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Package className="w-8 h-8 mr-3 text-indigo-600" />
            Criar Lote de Exportação
          </h1>
          <p className="text-gray-600">Agregue produtores para formar um lote único de exportação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Lote */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Informações do Lote</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Lote</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Ex: Lote Café Premium Janeiro 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  <option value="">Selecione o produto</option>
                  <option value="Café">☕ Café</option>
                  <option value="Cacau">🍫 Cacau</option>
                  <option value="Madeira">🌳 Madeira</option>
                  <option value="Outros">📦 Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Total (toneladas)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  placeholder={`Auto: ${totalSelected.toFixed(1)}t`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origem (ex: Luanda)</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={origin} onChange={(e)=>setOrigin(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destino (ex: Lisboa)</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={destination} onChange={(e)=>setDestination(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Transporte</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={modoTransporte} onChange={(e)=>setModoTransporte(e.target.value)}>
                  <option value="Carro">🚗 Carro</option>
                  <option value="Avião">✈️ Avião</option>
                  <option value="Navio">🚢 Navio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seleção de Produtores */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Produtores ({selectedProducers.length} selecionados)
              </h2>
              <button
                type="button"
                onClick={() => setShowAddProducer(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Produtor
              </button>
            </div>

            {/* Adicionar Novo Produtor */}
            {showAddProducer && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Adicionar Novo Produtor</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProducer(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome do produtor"
                    value={newProducer.name}
                    onChange={(e) => setNewProducer({...newProducer, name: e.target.value})}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Localização"
                    value={newProducer.location}
                    onChange={(e) => setNewProducer({...newProducer, location: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Quantidade (t)"
                      value={newProducer.quantity}
                      onChange={(e) => setNewProducer({...newProducer, quantity: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={addProducer}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Produtores */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {producers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum produtor cadastrado</p>
                  <p className="text-sm">Adicione produtores para criar lotes</p>
                </div>
              ) : (
                producers.map(producer => {
                  const isSelected = selectedProducers.find(p => p.id === producer.id)
                  return (
                    <div
                      key={producer.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProducer(producer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{producer.name}</h3>
                          <p className="text-sm text-gray-600">{producer.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{producer.quantity}t</div>
                          {isSelected && (
                            <div className="text-xs text-indigo-600 font-medium">SELECIONADO</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {selectedProducers.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-indigo-900">
                    Total Selecionado: {selectedProducers.length} produtores
                  </span>
                  <span className="font-bold text-indigo-900">
                    {totalSelected.toFixed(1)} toneladas
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Criar Lote */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              type="submit"
              disabled={selectedProducers.length === 0}
              className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              <Package className="w-5 h-5 mr-2" />
              Criar Lote de Exportação
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}