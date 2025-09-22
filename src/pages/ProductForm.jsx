import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProductForm(){
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [modoTransporte, setModoTransporte] = useState('Carro')
  const navigate = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    const id = Date.now().toString()
    const product = { id, name, quantity, origin, destination, modoTransporte, checkpoints: [] }
    const db = JSON.parse(localStorage.getItem('productsDB') || '[]')
    db.push(product)
    localStorage.setItem('productsDB', JSON.stringify(db))
    navigate(`/license/${id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold">Cadastrar Produto</h2>

      <div>
        <label className="block text-sm font-medium">Nome do produto</label>
        <input required className="w-full border p-2 rounded" value={name} onChange={(e)=>setName(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Quantidade</label>
        <input required type="number" min="1" className="w-full border p-2 rounded" value={quantity} onChange={(e)=>setQuantity(parseInt(e.target.value||1))} />
      </div>

      <div>
        <label className="block text-sm font-medium">Origem (ex: Luanda)</label>
        <input required className="w-full border p-2 rounded" value={origin} onChange={(e)=>setOrigin(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Destino (ex: Lisboa)</label>
        <input required className="w-full border p-2 rounded" value={destination} onChange={(e)=>setDestination(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Modo de Transporte</label>
        <select className="w-full border p-2 rounded" value={modoTransporte} onChange={(e)=>setModoTransporte(e.target.value)}>
          <option value="Carro">🚗 Carro</option>
          <option value="Avião">✈️ Avião</option>
        </select>
      </div>

      <div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded">Gerar Licença</button>
      </div>
    </form>
  )
}
