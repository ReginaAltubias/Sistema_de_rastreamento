import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Edit, Circle, FileX, MapPin, Truck, Ship, Train, Plane, Package, Copy, User, LogOut } from 'lucide-react'
import Timeline from '../components/Timeline'
import QRCode from 'qrcode.react'

// Corrige ícones do leaflet (URLs para ícones)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function TrackingPage() {
  const { id } = useParams()
  const [db, setDb] = useState(JSON.parse(localStorage.getItem('productsDB') || '[]'))
  const [route, setRoute] = useState([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [user, setUser] = useState(localStorage.getItem('user') || null)
  const product = db.find(p => p.id === id)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    name: product?.name || '',
    quantity: product?.quantity || '',
    origin: product?.origin || '',
    destination: product?.destination || ''
  })

  // great circle distance (km)
  function greatCircleDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const defaultIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  function isInternationalConnection(lat1, lng1, lat2, lng2) {
    const distance = greatCircleDistance(lat1, lng1, lat2, lng2)
    return distance > 1000
  }

  // status based on checkpoints
  function computeStatus() {
    if (!product) return 'Desconhecido'
    if (product.checkpoints.length === 0) return 'Aguardando despacho'
    const last = product.checkpoints[product.checkpoints.length - 1]
    // geocode destination to coords to check proximity
    return 'Em trânsito' // default
  }

  const [status, setStatus] = useState('Aguardando despacho')

  useEffect(() => {
    setStatus(computeStatus())
  }, [db])

  useEffect(() => {
    if (!product) return
    async function fetchRoute() {
      setLoadingRoute(true)
      try {
        const orRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(product.origin)}`)
        const orJson = await orRes.json()
        if (!orJson || orJson.length === 0) return
        const [olat, olng] = [parseFloat(orJson[0].lat), parseFloat(orJson[0].lon)]

        const deRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(product.destination)}`)
        const deJson = await deRes.json()
        if (!deJson || deJson.length === 0) return
        const [dlat, dlng] = [parseFloat(deJson[0].lat), parseFloat(deJson[0].lon)]

        setOriginCoords([olat, olng])
        setDestCoords([dlat, dlng])

        if (product.modoTransporte === 'Avião') {
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
        console.error('erro rota', err)
        setRoute([[0, 0], [0, 0]])
      } finally {
        setLoadingRoute(false)
      }
    }
    fetchRoute()
  }, [product?.origin, product?.destination])

  if (!product) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileX className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Produto não encontrado</h2>
        <p className="text-gray-600 mb-6">O produto que você está procurando não existe ou foi removido.</p>
        <Link to="/" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Voltar ao início
        </Link>
      </div>
    </div>
  )

  function persistDb(newDb) {
    setDb(newDb)
    localStorage.setItem('productsDB', JSON.stringify(newDb))
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
    const nextDestination = prompt('Próximo destino (opcional):', '') || ''
    const notes = prompt('Observações (opcional):', '') || ''

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
          desc: `${provincia}${municipio ? ', ' + municipio : ''}` || 'Localização desconhecida',
          operator: user,
          transport,
          status,
          nextDestination,
          notes
        }
        product.checkpoints.push(checkpoint)
        const newDb = db.map(p => p.id === product.id ? product : p)
        persistDb(newDb)
        setStatus('Em trânsito')
      } catch (err) {
        const checkpoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toLocaleString(),
          desc: 'Checkpoint automático',
          operator: user,
          transport,
          status,
          nextDestination,
          notes
        }
        product.checkpoints.push(checkpoint)
        const newDb = db.map(p => p.id === product.id ? product : p)
        persistDb(newDb)
        setStatus('Em trânsito')
      }
    }, (err) => {
      alert('Erro ao obter localização: ' + err.message)
    }, { enableHighAccuracy: true })
  }

  function editCheckpoint(index) {
    if (!user) {
      alert('Faça login para editar checkpoint.')
      return
    }
    const value = prompt('Editar descrição do checkpoint:', product.checkpoints[index].desc)
    if (value !== null) {
      product.checkpoints[index].desc = value + ` (editado por ${user})`
      product.checkpoints[index].operator = user
      const newDb = db.map(p => p.id === product.id ? product : p)
      persistDb(newDb)
    }
  }

  function handleEditChange(e) {
    setEditData({ ...editData, [e.target.name]: e.target.value })
  }

  function saveEdit() {
    product.name = editData.name
    product.quantity = editData.quantity
    product.origin = editData.origin
    product.destination = editData.destination
    const newDb = db.map(p => p.id === product.id ? product : p)
    persistDb(newDb)
    setEditMode(false)
  }

  // compute proximity to destination to auto mark Delivered
  async function checkDelivered() {
    try {
      const deRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(product.destination)}`)
      const deJson = await deRes.json()
      if (!deJson || deJson.length === 0) return false
      const [dlat, dlng] = [parseFloat(deJson[0].lat), parseFloat(deJson[0].lon)]
      if (product.checkpoints.length === 0) return false
      const last = product.checkpoints[product.checkpoints.length - 1]
      const dist = greatCircleDistance(last.lat, last.lng, dlat, dlng)
      if (dist <= 5) {
        setStatus('Entregue')
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  useEffect(() => {
    checkDelivered()
  }, [db])

  const mapCenter = route.length > 0 ? route[Math.floor(route.length / 10)] : (product.checkpoints[0] ? [product.checkpoints[0].lat, product.checkpoints[0].lng] : [0, 0])

  // Monta os dados do produto em formato texto
  const qrData = `
    Produto: ${product.name}
    Quantidade: ${product.quantity}
    Origem: ${product.origin}
    Destino: ${product.destination}
  `;

  // Função para retornar a imagem do transporte
  function getTransportIconHTML(transport) {
    switch (transport) {
      case 'Camião':
      case 'Carro':
        return `<img src="/src/image/camiao.png" alt="Camião" style="width:32px;height:32px;position:relative;top:-10px;" />`
      case 'Navio':
        return `<img src="/src/image/navio.png" alt="Navio" style="width:32px;height:32px;position:relative;top:-10px;" />`
      case 'Comboio':
        return `<img src="/src/image/comboio.png" alt="Comboio" style="width:32px;height:32px;position:relative;top:-10px;" />`
      case 'Avião':
        return `<img src="/src/image/aviao.png" alt="Avião" style="width:32px;height:32px;position:relative;top:-10px;" />`
      default:
        return `<img src="/src/image/pacote.png" alt="Pacote" style="width:32px;height:32px;position:relative;top:-10px;" />`
    }
  }

  // Função para obter cor do status
  function getStatusColor(status) {
    switch (status) {
      case 'Entregue': return 'bg-green-100 text-green-800 border-green-200'
      case 'Em trânsito': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Aguardando despacho': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Função para obter ícone do transporte
  function getTransportIcon(transport) {
    switch (transport) {
      case 'Camião': return <Truck className="w-4 h-4" />
      case 'Navio': return <Ship className="w-4 h-4" />
      case 'Comboio': return <Train className="w-4 h-4" />
      case 'Avião': return <Plane className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rastreamento de Produto</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${getStatusColor(status)} font-semibold`}>
                  <Circle className={`w-3 h-3 mr-2 ${status === 'Entregue' ? 'fill-green-500' : status === 'Em trânsito' ? 'fill-blue-500' : 'fill-yellow-500'}`} />
                  {status}
                </div>
                <div className="text-sm text-gray-600">
                  ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!user ? (
                <button 
                  onClick={login} 
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <User className="w-4 h-4 mr-2" />
                  Fazer Login
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">Logado como <strong>{user}</strong></span>
                  </div>
                  <button 
                    onClick={logout} 
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </button>
                </div>
              )}
              <button 
                onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copiado!') }} 
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sidebar - Informações do Produto e Timeline */}
          <div className="xl:col-span-1 space-y-6">
            {/* Card de Informações do Produto */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-indigo-600" />
                  Informações do Produto
                </h3>
                <button 
                  onClick={() => setEditMode(!editMode)} 
                  className="flex items-center px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {editMode ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      name="name" 
                      value={editData.name} 
                      onChange={handleEditChange} 
                      placeholder="Nome do produto" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      name="quantity" 
                      value={editData.quantity} 
                      onChange={handleEditChange} 
                      placeholder="Quantidade" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      name="origin" 
                      value={editData.origin} 
                      onChange={handleEditChange} 
                      placeholder="Origem" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      name="destination" 
                      value={editData.destination} 
                      onChange={handleEditChange} 
                      placeholder="Destino" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveEdit} 
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Produto</span>
                    <span className="text-gray-900 font-semibold">{product.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Quantidade</span>
                    <span className="text-gray-900 font-semibold">{product.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Origem</span>
                    <span className="text-gray-900 font-semibold text-right">{product.origin}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Destino</span>
                    <span className="text-gray-900 font-semibold text-right">{product.destination}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card de Ações */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                Ações de Rastreamento
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={addCheckpoint} 
                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Registrar Checkpoint
                </button>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Meio de Transporte</label>
                  <select 
                    id="transportSelect" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Camião">🚚 Camião</option>
                    <option value="Navio">🚢 Navio</option>
                    <option value="Comboio">🚂 Comboio</option>
                    <option value="Avião">✈️ Avião</option>
                  </select>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Código QR</h3>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200">
                  <QRCode value={qrData} size={128} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">Use este código para acesso rápido às informações do produto</p>
            </div>
          </div>

          {/* Conteúdo Principal - Mapa e Timeline */}
          <div className="xl:col-span-2 space-y-6">
            {/* Card do Mapa */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Mapa de Rastreamento
                </h3>
              </div>
              <div className="h-96">
                <MapContainer center={mapCenter} zoom={4} className="h-full w-full" scrollWheelZoom={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {/* Rota principal: origem até destino */}
                  {route.length > 0 && (
                    <Polyline
                      positions={route}
                      pathOptions={{
                        color: product.modoTransporte === 'Avião' ? 'blue' : 'green',
                        weight: 4, 
                        dashArray: '8, 8'
                      }}
                    />
                  )}

                  {/* Trajeto percorrido (checkpoints) */}
                  {product.checkpoints.length > 0 && (
                    <Polyline
                      positions={[
                        originCoords,
                        ...product.checkpoints.map(c => [
                          parseFloat(c.lat),
                          parseFloat(c.lng)
                        ])
                      ]}
                      pathOptions={{
                        color: 'orange',
                        weight: 4,
                        dashArray: '8 8'
                      }}
                    />
                  )}

                  {/* Marcadores de origem e destino */}
                  {originCoords && (
                    <CircleMarker center={originCoords} radius={8} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.8 }}>
                      <Popup>Origem: {product.origin}</Popup>
                    </CircleMarker>
                  )}
                  {destCoords && (
                    <CircleMarker center={destCoords} radius={8} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.8 }}>
                      <Popup>Destino: {product.destination}</Popup>
                    </CircleMarker>
                  )}

                  {/* Marcadores dos checkpoints */}
                  {product.checkpoints.map((c, i) => (
                    <Marker key={i} position={[c.lat, c.lng]}>
                      <Popup>
                        <div className="min-w-[200px]">
                          <div className="font-semibold mb-2">{c.desc}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>📅 {c.timestamp}</div>
                            <div>👤 Operador: {c.operator || 'N/A'}</div>
                            <div className="flex items-center">
                              {getTransportIcon(c.transport)}
                              <span className="ml-2">Transporte: {c.transport}</span>
                            </div>
                            {c.notes && <div>📝 {c.notes}</div>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Ícone do transporte no último checkpoint */}
                  {product.checkpoints.map((c, i) => {
                    const isLast = i === product.checkpoints.length - 1;

                    return (
                      <Marker
                        key={i}
                        position={[c.lat, c.lng]}
                        icon={isLast
                          ? L.divIcon({
                            className: "",
                            html: getTransportIconHTML(c.transport),
                          })
                          : defaultIcon
                        }
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <div className="font-semibold mb-2">{c.desc}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>📅 {c.timestamp}</div>
                              <div>👤 Operador: {c.operator || 'N/A'}</div>
                              <div className="flex items-center">
                                {getTransportIcon(c.transport)}
                                <span className="ml-2">Transporte: {c.transport}</span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              
              {product.modoTransporte && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className={`text-sm font-medium ${
                    product.modoTransporte === 'Avião' ? 'text-blue-600' :
                    product.modoTransporte === 'Carro' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {product.modoTransporte === 'Avião' && '✈️ Rota aérea - conexão direta'}
                    {product.modoTransporte === 'Carro' && '🚚 Rota terrestre - trajeto por estradas'}
                    {product.modoTransporte === 'Navio' && '🚢 Rota marítima - transporte por navio'}
                    {product.modoTransporte === 'Comboio' && '🚂 Rota ferroviária - transporte por comboio'}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Linha do Tempo</h3>
              <Timeline checkpoints={product.checkpoints} route={route} modoTransporte={product.modoTransporte} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}