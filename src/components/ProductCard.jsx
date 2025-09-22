import QRCode from 'qrcode.react'
import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const qrPayload = `${window.location.origin}/track/${product.id}`

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold">{product.name}</h3>
      <p className="text-sm text-gray-600">ID: {product.id}</p>
      <p className="text-sm">{product.origin} → {product.destination}</p>
      <p className="text-sm">{product.modoTransporte === 'Avião' ? '✈️' : '🚗'} {product.modoTransporte}</p>
      
      <div className="mt-2">
        <QRCode value={qrPayload} size={100} />
      </div>
      
      <div className="mt-2 flex gap-2">
        <Link to={`/license/${product.id}`} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
          Licença
        </Link>
        <Link to={`/track/${product.id}`} className="text-xs px-2 py-1 bg-green-600 text-white rounded">
          Rastrear
        </Link>
      </div>
    </div>
  )
}