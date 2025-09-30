import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Package, Users, MapPin, Shield, Calendar, Truck, Ship, Plane } from 'lucide-react'

// Corrige ícones do leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function PublicBatch() {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState([])
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)

  useEffect(() => {
    // Simula busca em API pública
    setTimeout(() => {
      const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
      const foundBatch = batchesDB.find(b => b.id === id)
      setBatch(foundBatch)
      setLoading(false)
    }, 500)
  }, [id])

  function getStatusColor(status) {
    switch (status) {
      case 'Entregue': return 'bg-green-100 text-green-800 border-green-200'
      case 'Em trânsito': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Selado': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Criado': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  function getTransportIcon(transport) {
    switch (transport) {
      case 'Camião': return <Truck className="w-4 h-4" />
      case 'Navio': return <Ship className="w-4 h-4" />
      case 'Avião': return <Plane className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do lote...</p>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lote não encontrado</h2>
          <p className="text-gray-600">O lote que você está procurando não existe ou não está disponível publicamente.</p>
        </div>
      </div>
    )
  }

  const mapCenter = batch.checkpoints && batch.checkpoints.length > 0
    ? [batch.checkpoints[0].lat, batch.checkpoints[0].lng]
    : [0, 0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Público */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal Público de Rastreabilidade</h1>
              <p className="text-gray-600">Consulta transparente de lotes de exportação</p>
            </div>
            <div className="text-sm text-gray-500">
              🌍 Acesso Público
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 mt-6">
        {/* Informações Principais */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {batch.name}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${getStatusColor(batch.status)} font-semibold`}>
                  {batch.sealed && <Shield className="w-4 h-4 mr-2" />}
                  {batch.status}
                </div>
                <div className="text-sm text-gray-600">
                  Código: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-lg">{batch.batchCode}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{batch.totalQuantity}t</div>
              <div className="text-sm text-gray-600">{batch.product}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Lote */}
          <div className="lg:col-span-1 space-y-6">
            {/* Origem do Lote */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-600" />
                Origem do Lote
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produtos</span>
                  <div className="text-right">
                    {(() => {
                      const productTotals = batch.producers.reduce((acc, producer) => {
                        if (producer.batchProducts) {
                          Object.entries(producer.batchProducts).forEach(([product, qty]) => {
                            acc[product] = (acc[product] || 0) + qty
                          })
                        }
                        return acc
                      }, {})
                      return Object.entries(productTotals).map(([product, qty]) => (
                        <div key={product} className="font-semibold text-sm">{product}: {qty.toFixed(1)}t</div>
                      ))
                    })()}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade Total</span>
                  <span className="font-semibold">{batch.totalQuantity} toneladas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origem</span>
                  <span className="font-semibold text-sm">{batch.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Destino</span>
                  <span className="font-semibold text-sm">{batch.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Produtores</span>
                  <span className="font-semibold">{batch.producers?.length || 0} agregados</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação</span>
                  <span className="font-semibold text-sm">
                    {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Selagem Registrada */}
            {batch.sealed && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600" />
                  Selagem Registrada
                </h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center text-purple-700 mb-2">
                    <Shield className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Lote Oficialmente Selado</span>
                  </div>
                  <div className="text-sm text-purple-600 space-y-1">
                    <div>👤 Responsável: {batch.sealedBy}</div>
                    <div>📅 Data: {new Date(batch.sealedAt).toLocaleString('pt-BR')}</div>
                    <div>🔒 Integridade garantida</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Produtores Agregados */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Produtores Agregados
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {batch.producers && batch.producers.map((producer, index) => (
                  <div key={producer.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{producer.name}</h4>
                        <p className="text-sm text-gray-600">📍 {producer.location}</p>
                        <p className="text-xs text-indigo-600 font-mono mt-1">
                          ID: {producer.subCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-indigo-600">{producer.quantity}t</div>
                        <div className="text-xs text-gray-500">
                          {((producer.quantity / batch.totalQuantity) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapa e Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa de Rastreamento */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Rastreamento em Tempo Real
                </h3>
              </div>
              <div className="h-96">
                {batch.checkpoints.length > 0 ? (
                  <MapContainer center={mapCenter} zoom={4} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Rota planejada */}
                    {route.length > 0 && (
                      <Polyline
                        positions={route}
                        pathOptions={{
                          color: batch.modoTransporte === 'Avião' ? 'blue' : 'green',
                          weight: 4,
                          dashArray: '8, 8'
                        }}
                      />
                    )}

                    {/* Marcadores origem/destino */}
                    {originCoords && (
                      <CircleMarker center={originCoords} radius={8} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.8 }}>
                        <Popup>Origem: {batch.origin}</Popup>
                      </CircleMarker>
                    )}
                    {destCoords && (
                      <CircleMarker center={destCoords} radius={8} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.8 }}>
                        <Popup>Destino: {batch.destination}</Popup>
                      </CircleMarker>
                    )}

                    {batch.checkpoints && batch.checkpoints.map((checkpoint, index) => (
                      <Marker key={index} position={[checkpoint.lat, checkpoint.lng]}>
                        <Popup>
                          <div className="min-w-[200px]">
                            <div className="font-semibold mb-2">{checkpoint.desc}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>📅 {checkpoint.timestamp}</div>
                              <div>👤 {checkpoint.operator}</div>
                              <div className="flex items-center">
                                {getTransportIcon(checkpoint.transport)}
                                <span className="ml-2">{checkpoint.transport}</span>
                              </div>
                              <div>📍 Status: {checkpoint.status}</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhum checkpoint registrado ainda</p>
                      <p className="text-sm">O rastreamento aparecerá aqui quando o lote iniciar o transporte</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Linha do Tempo dos Checkpoints */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Linha do Tempo
              </h3>

              {batch.checkpoints.length > 0 ? (
                <div className="space-y-4">
                  {/* Criação do Lote */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Lote Criado</div>
                      <div className="text-sm text-gray-600">
                        {new Date(batch.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Selagem */}
                  {batch.sealed && (
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Lote Selado</div>
                        <div className="text-sm text-gray-600">
                          {new Date(batch.sealedAt).toLocaleString('pt-BR')} • {batch.sealedBy}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkpoints */}
                  {batch.checkpoints.map((checkpoint, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getTransportIcon(checkpoint.transport)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{checkpoint.desc}</div>
                        <div className="text-sm text-gray-600">
                          {checkpoint.timestamp} • {checkpoint.transport} • {checkpoint.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum evento de transporte registrado</p>
                  <p className="text-sm">A linha do tempo será atualizada conforme o lote se move</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Público */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-gray-600">
            <p className="mb-2">🌍 <strong>Portal Público de Rastreabilidade</strong></p>
            <p className="text-sm">
              Este lote pode ser rastreado publicamente para garantir transparência na cadeia de exportação.
              Todas as informações são verificadas e auditáveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}