import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Users, Plus, X } from 'lucide-react'

export default function BatchForm() {
  const [batchName, setBatchName] = useState('')

  const [totalQuantity, setTotalQuantity] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [modoTransporte, setModoTransporte] = useState('Carro')
  const [selectedProducers, setSelectedProducers] = useState([])
  const [producerProducts, setProducerProducts] = useState({})
  const [producers, setProducers] = useState([])
  const [newProducer, setNewProducer] = useState({
    name: '',
    bi: '',
    type: '',
    products: {},
    location: '',
    quantity: ''
  })
  const [showAddProducer, setShowAddProducer] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedProducers = JSON.parse(localStorage.getItem('producersDB') || '[]')
    setProducers(savedProducers)
  }, [])

  function addProducer() {
    if (!newProducer.name || !newProducer.bi || !newProducer.type || !newProducer.location) return
    if (Object.keys(newProducer.products).length === 0) return

    const totalQuantity = Object.values(newProducer.products).reduce((sum, qty) => sum + parseFloat(qty || 0), 0)

    const producer = {
      id: Date.now().toString(),
      ...newProducer,
      quantity: totalQuantity
    }

    const updatedProducers = [...producers, producer]
    setProducers(updatedProducers)
    localStorage.setItem('producersDB', JSON.stringify(updatedProducers))
    setNewProducer({ name: '', bi: '', type: '', products: {}, location: '', quantity: '' })
    setShowAddProducer(false)
  }

  function toggleProducer(producer) {
    const isSelected = selectedProducers.find(p => p.id === producer.id)
    if (isSelected) {
      setSelectedProducers(selectedProducers.filter(p => p.id !== producer.id))
      const newProducts = { ...producerProducts }
      delete newProducts[producer.id]
      setProducerProducts(newProducts)
    } else {
      setSelectedProducers([...selectedProducers, producer])
      setProducerProducts({ ...producerProducts, [producer.id]: {} })
    }
  }

  function updateProducerProduct(producerId, productType, quantity) {
    const newProducts = { ...producerProducts }
    if (!newProducts[producerId]) newProducts[producerId] = {}

    if (quantity === '') {
      delete newProducts[producerId][productType]
    } else {
      newProducts[producerId][productType] = parseFloat(quantity) || 0
    }

    setProducerProducts(newProducts)
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
    const calculatedTotal = Object.values(producerProducts).reduce((sum, products) => {
      return sum + Object.values(products).reduce((pSum, qty) => pSum + qty, 0)
    }, 0)

    const producersWithProducts = selectedProducers.map(producer => ({
      ...producer,
      batchProducts: producerProducts[producer.id] || {},
      batchQuantity: Object.values(producerProducts[producer.id] || {}).reduce((sum, qty) => sum + qty, 0)
    }))
    
    const producersWithSubCodes = generateSubCodes(batchCode, producersWithProducts)

    const batch = {
      id: Date.now().toString(),
      batchCode,
      name: batchName,
      totalQuantity: calculatedTotal,
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

  const totalSelected = Object.values(producerProducts).reduce((sum, products) => {
    return sum + Object.values(products).reduce((pSum, qty) => pSum + qty, 0)
  }, 0)

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Total (toneladas)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  value={totalSelected.toFixed(1)}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origem (ex: Luanda)</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destino (ex: Lisboa)</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Transporte</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={modoTransporte} onChange={(e) => setModoTransporte(e.target.value)}>
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
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nome do produtor"
                      value={newProducer.name}
                      onChange={(e) => setNewProducer({ ...newProducer, name: e.target.value })}
                    />
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="BI"
                      value={newProducer.bi}
                      onChange={(e) => setNewProducer({ ...newProducer, bi: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newProducer.type}
                      onChange={(e) => setNewProducer({ ...newProducer, type: e.target.value })}
                    >
                      <option value="">Tipo de Produtor</option>
                      <option value="Florestal">Florestal</option>
                      <option value="Agrícola">Agrícola</option>
                    </select>
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Localização"
                      value={newProducer.location}
                      onChange={(e) => setNewProducer({ ...newProducer, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Produtos:</label>
                    <div className="space-y-2">
                      {['Café', 'Cacau', 'Madeira'].map(productType => {
                        const inputId = `prod-${producer.id}-${productType}`;
                        return (
                          <div key={productType} className="flex items-center gap-3">
                            <div className="flex items-center min-w-[80px]">
                              <label htmlFor={inputId} className="flex items-center cursor-pointer">
                                <input
                                  id={inputId}
                                  type="checkbox"
                                  checked={producerBatchProducts[productType] !== undefined}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateProducerProduct(producer.id, productType, '0') // Ativa e mostra campo
                                    } else {
                                      updateProducerProduct(producer.id, productType, '') // Remove produto
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span>{productType}</span>
                              </label>
                            </div>
                            {producerBatchProducts[productType] !== undefined && (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="Qtd (t)"
                                value={producerBatchProducts[productType] || ''}
                                onChange={(e) => updateProducerProduct(producer.id, productType, e.target.value)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addProducer}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Adicionar Produtor
                  </button>
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
                  const producerBatchProducts = producerProducts[producer.id] || {}
                  const batchTotal = Object.values(producerBatchProducts).reduce((sum, qty) => sum + qty, 0)

                  return (
                    <div key={producer.id} className={`border-2 rounded-lg p-4 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}>
                      <div className="flex items-center gap-3" onClick={() => toggleProducer(producer)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProducer(producer)}
                          className="w-4 h-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{producer.name}</h3>
                          <p className="text-sm text-gray-600">{producer.location}</p>
                          <p className="text-xs text-gray-500">BI: {producer.bi} • {producer.type}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="border-t pt-3 space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Produtos para o lote:</label>
                          {['Café', 'Cacau', 'Madeira'].map(productType => {
                            const inputId = `prod-${producer.id}-${productType}`;
                            return (
                              <div key={productType} className="flex items-center gap-3">
                                <div className="flex items-center min-w-[80px]">
                                  <label htmlFor={inputId} className="flex items-center cursor-pointer">
                                    <input
                                      id={inputId}
                                      type="checkbox"
                                      checked={producerBatchProducts[productType] !== undefined}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          updateProducerProduct(producer.id, productType, '0')
                                        } else {
                                          updateProducerProduct(producer.id, productType, '')
                                        }
                                      }}
                                      className="mr-2"
                                    />
                                    <span>{productType}</span>
                                  </label>
                                </div>
                                {producerBatchProducts[productType] !== undefined && (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                                    placeholder="Qtd (t)"
                                    value={producerBatchProducts[productType] ?? ''}
                                    onChange={(e) => updateProducerProduct(producer.id, productType, e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {selectedProducers.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-indigo-900">
                    {selectedProducers.length} produtores selecionados
                  </span>
                  <span className="font-bold text-indigo-900">
                    {totalSelected.toFixed(1)} toneladas
                  </span>
                </div>
                {totalSelected > 0 && (
                  <div className="text-sm text-indigo-700">
                    {(() => {
                      const productTotals = Object.values(producerProducts).reduce((acc, products) => {
                        Object.entries(products).forEach(([product, qty]) => {
                          acc[product] = (acc[product] || 0) + qty
                        })
                        return acc
                      }, {})
                      return Object.entries(productTotals).map(([product, qty]) => `${product}: ${qty.toFixed(1)}t`).join(' • ')
                    })()}
                  </div>
                )}
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