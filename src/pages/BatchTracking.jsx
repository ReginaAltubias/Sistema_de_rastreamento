import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Package, Users, MapPin, Truck, Ship, Plane, QrCode, Shield, User, LogOut, Copy, Edit } from 'lucide-react'
import QRCode from 'qrcode.react'
import BatchTimeline from '../components/BatchTimeline'

// Corrige ícones do leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function BatchTracking() {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [user, setUser] = useState(localStorage.getItem('user') || null)
  const [route, setRoute] = useState([])
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)

  useEffect(() => {
    const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
    const foundBatch = batchesDB.find(b => b.id === id)
    setBatch(foundBatch)
    if (foundBatch && foundBatch.origin && foundBatch.destination) {
      fetchRoute(foundBatch)
    }
  }, [id])

  async function fetchRoute(batch) {
    try {
      const orRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(batch.origin)}`)
      const orJson = await orRes.json()
      if (!orJson || orJson.length === 0) return
      const [olat, olng] = [parseFloat(orJson[0].lat), parseFloat(orJson[0].lon)]

      const deRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(batch.destination)}`)
      const deJson = await deRes.json()
      if (!deJson || deJson.length === 0) return
      const [dlat, dlng] = [parseFloat(deJson[0].lat), parseFloat(deJson[0].lon)]

      setOriginCoords([olat, olng])
      setDestCoords([dlat, dlng])

      if (batch.modoTransporte === 'Avião') {
        setRoute([[olat, olng], [dlat, dlng]])
      } else {
        const osrm = await fetch(`https://router.project-osrm.org/route/v1/driving/${olng},${olat};${dlng},${dlat}?overview=full&geometries=geojson`)
        const osrmJson = await osrm.json()
        if (osrmJson.routes && osrmJson.routes.length > 0) {
          const coords = osrmJson.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
          setRoute(coords)
        } else {
          setRoute([[olat, olng], [dlat, dlng]])
        }
      }
    } catch (err) {
      console.error('Erro ao buscar rota:', err)
    }
  }

  function login() {
    const name = prompt('Digite seu nome para login:')
    if (name) {
      localStorage.setItem('user', name)
      setUser(name)
    }
  }

  function logout() {
    localStorage.removeItem('user')
    setUser(null)
  }

  function sealBatch() {
    if (!user) {
      alert('Faça login para selar o lote.')
      return
    }
    
    const updatedBatch = {
      ...batch,
      sealed: true,
      sealedBy: user,
      sealedAt: new Date().toISOString(),
      status: 'Selado'
    }
    
    const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
    const updatedDB = batchesDB.map(b => b.id === batch.id ? updatedBatch : b)
    localStorage.setItem('batchesDB', JSON.stringify(updatedDB))
    setBatch(updatedBatch)
  }

  async function addCheckpoint() {
    if (!user) {
      alert('Faça login para registrar checkpoint.')
      return
    }
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada')
      return
    }

    const transportSelect = document.getElementById('transportSelect')
    const transport = transportSelect?.value || 'Camião'
    const status = prompt('Status:', 'Em trânsito') || 'Em trânsito'
    const location = prompt('Local/Posto de controle:', '') || ''

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`)
        const data = await res.json()
        const address = data.address || {}
        const provincia = address.state || address.province || ''
        const municipio = address.city || address.town || address.village || address.municipality || ''

        const checkpoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toLocaleString(),
          desc: location || `${provincia}${municipio ? ', ' + municipio : ''}` || 'Checkpoint automático',
          operator: user,
          transport,
          status
        }

        const updatedBatch = {
          ...batch,
          checkpoints: [...batch.checkpoints, checkpoint],
          status: 'Em trânsito'
        }

        const batchesDB = JSON.parse(localStorage.getItem('batchesDB') || '[]')
        const updatedDB = batchesDB.map(b => b.id === batch.id ? updatedBatch : b)
        localStorage.setItem('batchesDB', JSON.stringify(updatedDB))
        setBatch(updatedBatch)
      } catch (err) {
        console.error('Erro ao obter localização:', err)
      }
    })
  }

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

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lote não encontrado</h2>
          <Link to="/batches" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lotes
          </Link>
        </div>
      </div>
    )
  }

  const qrData = `${window.location.origin}/public/batch/${batch.id}`
  const mapCenter = batch.checkpoints.length > 0 
    ? [batch.checkpoints[0].lat, batch.checkpoints[0].lng] 
    : [0, 0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Lote: {batch.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${getStatusColor(batch.status)} font-semibold`}>
                  {batch.sealed && <Shield className="w-4 h-4 mr-2" />}
                  {batch.status}
                </div>
                <div className="text-sm text-gray-600">
                  Código: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{batch.batchCode}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!user ? (
                <button onClick={login} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <User className="w-4 h-4 mr-2" />
                  Login
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm bg-blue-50 px-3 py-2 rounded-lg">
                    👤 {user}
                  </span>
                  <button onClick={logout} className="text-red-600 hover:text-red-800">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button 
                onClick={() => { navigator.clipboard?.writeText(qrData); alert('Link público copiado!') }}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Link Público
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Informações do Lote */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-600" />
                Informações do Lote
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto</span>
                  <span className="font-semibold">{batch.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade Total</span>
                  <span className="font-semibold">{batch.totalQuantity}t</span>
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
                  <span className="text-gray-600">Transporte</span>
                  <span className="font-semibold">{batch.modoTransporte}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Produtores</span>
                  <span className="font-semibold">{batch.producers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Criado em</span>
                  <span className="font-semibold text-sm">
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {batch.sealed && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center text-purple-600 mb-2">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="font-semibold">Lote Selado</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Por: {batch.sealedBy}<br />
                      Em: {new Date(batch.sealedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Produtores */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Produtores Agregados
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {batch.producers.map((producer, index) => (
                  <div key={producer.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{producer.name}</h4>
                        <p className="text-sm text-gray-600">{producer.location}</p>
                        <p className="text-xs text-indigo-600 font-mono">
                          Subcódigo: {producer.subCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{producer.quantity}t</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Ações</h3>
              <div className="space-y-3">
                {!batch.sealed && (
                  <button
                    onClick={sealBatch}
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Selar Lote
                  </button>
                )}
                
                <button
                  onClick={addCheckpoint}
                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Registrar Checkpoint
                </button>
                
                <select id="transportSelect" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="Camião">🚚 Camião</option>
                  <option value="Navio">🚢 Navio</option>
                  <option value="Avião">✈️ Avião</option>
                </select>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
                <QrCode className="w-5 h-5 mr-2 text-indigo-600" />
                QR Code Público
              </h3>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200">
                  <QRCode value={qrData} size={128} />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Escaneie para acesso público ao lote
              </p>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Rastreamento do Lote
                </h3>
              </div>
              <div className="h-96">
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
                  
                  {batch.checkpoints.map((checkpoint, index) => (
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
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Linha do Tempo</h3>
              <BatchTimeline batch={batch} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}