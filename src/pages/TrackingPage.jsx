import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Edit, Circle, FileX } from 'lucide-react'
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
    <div className="bg-white p-6 rounded shadow text-center">
      <p className="mb-4">Produto não encontrado</p>
      <Link to="/" className="px-4 py-2 bg-indigo-600 text-white rounded">Voltar ao início</Link>
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

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Rastreamento</h2>
        <div className="text-sm">
          Status: <strong>{status}</strong>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="text-base font-semibold mb-2">Dados do Produto</div>
        {editMode ? (
          <div className="space-y-2">
            <input className="border rounded px-2 py-1 w-full" name="name" value={editData.name} onChange={handleEditChange} placeholder="Produto" />
            <input className="border rounded px-2 py-1 w-full" name="quantity" value={editData.quantity} onChange={handleEditChange} placeholder="Quantidade" />
            <input className="border rounded px-2 py-1 w-full" name="origin" value={editData.origin} onChange={handleEditChange} placeholder="Origem" />
            <input className="border rounded px-2 py-1 w-full" name="destination" value={editData.destination} onChange={handleEditChange} placeholder="Destino" />
            <div className="flex gap-2 mt-2">
              <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded">Salvar</button>
              <button onClick={() => setEditMode(false)} className="px-3 py-1 bg-gray-400 text-white rounded">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div><strong>Produto:</strong> {product.name}</div>
            <div><strong>Quantidade:</strong> {product.quantity}</div>
            <div><strong>Origem:</strong> {product.origin}</div>
            <div><strong>Destino:</strong> {product.destination}</div>
            <button onClick={() => setEditMode(true)} className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded">Editar dados do produto</button>
          </>
        )}
      </div>

      <div className="flex gap-3 items-center">
        {!user ? (
          <button onClick={login} className="px-3 py-2 bg-green-600 text-white rounded">Login</button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Logado como <strong>{user}</strong></span>
            <button onClick={logout} className="px-3 py-2 bg-red-600 text-white rounded">Logout</button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={addCheckpoint} className="px-4 py-2 bg-indigo-600 text-white rounded">Registrar Checkpoint</button>
          <select id="transportSelect" className="px-3 py-2 border rounded text-sm">
            <option value="Camião">🚚 Camião</option>
            <option value="Navio">🚢 Navio</option>
            <option value="Comboio">🚂 Comboio</option>
            <option value="Avião">✈️ Avião</option>
          </select>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copiado') }} className="px-3 py-2 border rounded">Copiar link</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Timeline checkpoints={product.checkpoints} route={route} modoTransporte={product.modoTransporte} />
          <div className="mt-6 flex flex-col items-center">
            <QRCode value={qrData} size={128} />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="h-80 mb-3">

            <MapContainer center={mapCenter} zoom={4} className="h-full rounded" scrollWheelZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Rota principal: origem até destino */}
              {route.length > 0 && (
                <Polyline
                  positions={route}
                  pathOptions={{
                    color: product.modoTransporte === 'Avião' ? 'blue' : 'green',
                    weight: 4, dashArray: '8, 8'
                  }}
                />
              )}

              {/* 2. Trajeto percorrido (checkpoints) */}
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
                    {c.desc}<br />
                    {c.timestamp}<br />
                    Operador: {c.operator || 'N/A'}<br />
                    <span className='flex'>
                      Transporte:{c.transport}
                    </span>
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
                      {c.desc}<br />
                      {c.timestamp}<br />
                      Operador: {c.operator || "N/A"}<br />
                      <span className="flex">
                        Transporte: {c.transport}
                      </span>
                    </Popup>
                  </Marker>
                );
              })}

            </MapContainer>
          </div>

          {product.modoTransporte === 'Avião' && (
            <div className="text-xs text-blue-600 mb-2">
              Rota aérea - conexão direta.
            </div>
          )}
          {product.modoTransporte === 'Carro' && (
            <div className="text-xs text-green-600 mb-2">
              Rota terrestre - trajeto por estradas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
