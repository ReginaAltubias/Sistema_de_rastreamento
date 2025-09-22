import { Clock, Truck, Plane, Ship, Train } from 'lucide-react'

export default function Timeline({ checkpoints, route, modoTransporte }){
  const getTransportIcon = (transport) => {
    switch(transport) {
      case 'Camião': case 'Carro': return '🚚'
      case 'Navio': return '🚢'
      case 'Comboio': return '🚂'
      case 'Avião': return '✈️'
      default: return '📦'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>📋 Timeline de Transporte</span>
      </div>

      <ol className="border-l-2 border-gray-200 border-dashed">
        {checkpoints.length === 0 && (
          <li className="ml-4 py-2 text-sm text-gray-500">Nenhum checkpoint registado</li>
        )}
        {checkpoints.map((c, i) => (
          <li key={i} className="ml-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg">
                {getTransportIcon(c.transport)}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.desc}</div>
                <div className="text-xs text-gray-600 mt-1">
                  <div>🕒 {c.timestamp}</div>
                  <div>🚛 {c.transport || 'N/A'} • {c.status || 'Em trânsito'}</div>
                  <div>👤 {c.operator || 'N/A'}</div>
                  <div>🌍 {c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}</div>
                  {c.nextDestination && <div>📍 Próximo: {c.nextDestination}</div>}
                  {c.notes && <div>📝 {c.notes}</div>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}