import { useParams, Link } from 'react-router-dom'
import QRCode from 'qrcode.react'

export default function LicensePage(){
  const { id } = useParams()
  const db = JSON.parse(localStorage.getItem('productsDB') || '[]')
  const product = db.find(p=>p.id === id)

  if(!product) return <p>Produto não encontrado</p>

  const qrPayload = `${window.location.origin}/track/${product.id}`

  function downloadQRCode(){
    const canvas = document.querySelector('canvas')
    if(!canvas) return alert('QR não encontrado')
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `licenca-${product.id}.png`
    a.click()
  }

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">Licença do Produto</h2>
      <p><strong>ID:</strong> {product.id}</p>
      <p><strong>Nome:</strong> {product.name}</p>
      <p><strong>Quantidade:</strong> {product.quantity}</p>
      <p><strong>Origem:</strong> {product.origin}</p>
      <p><strong>Destino:</strong> {product.destination}</p>

      <div className="mt-4">
        <QRCode value={qrPayload} size={220} />
      </div>

      <div className="flex gap-3">
        <button onClick={downloadQRCode} className="px-4 py-2 bg-green-600 text-white rounded">
          Baixar Licença (QR)
        </button>
        <Link to={`/track/${product.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded">Abrir Rastreio</Link>
      </div>
    </div>
  )
}
