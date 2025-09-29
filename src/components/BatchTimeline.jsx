import { Package, Shield, MapPin, Calendar, Truck, Ship, Plane } from 'lucide-react'

export default function BatchTimeline({ batch }) {
  function getTransportIcon(transport) {
    switch (transport) {
      case 'Camião': return <Truck className="w-4 h-4" />
      case 'Navio': return <Ship className="w-4 h-4" />
      case 'Avião': return <Plane className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  const events = []

  // Evento de criação
  const productTotals = batch.producers.reduce((acc, producer) => {
    if (producer.batchProducts) {
      Object.entries(producer.batchProducts).forEach(([product, qty]) => {
        acc[product] = (acc[product] || 0) + qty
      })
    }
    return acc
  }, {})
  
  const productsText = Object.entries(productTotals).map(([product, qty]) => `${product}: ${qty.toFixed(1)}t`).join(', ')
  
  events.push({
    type: 'created',
    timestamp: batch.createdAt,
    title: 'Lote Criado',
    description: `${batch.producers.length} produtores agregados • ${productsText}`,
    icon: <Package className="w-4 h-4" />,
    color: 'indigo'
  })

  // Evento de selagem
  if (batch.sealed) {
    events.push({
      type: 'sealed',
      timestamp: batch.sealedAt,
      title: 'Lote Selado',
      description: `Selado por ${batch.sealedBy} • Integridade garantida`,
      icon: <Shield className="w-4 h-4" />,
      color: 'purple'
    })
  }

  // Eventos de checkpoints
  batch.checkpoints.forEach((checkpoint, index) => {
    events.push({
      type: 'checkpoint',
      timestamp: checkpoint.timestamp,
      title: checkpoint.desc,
      description: `${checkpoint.transport} • ${checkpoint.status} • ${checkpoint.operator} • Lat: ${checkpoint.lat}, Lng: ${checkpoint.lng}`,
      icon: getTransportIcon(checkpoint.transport),
      color: 'blue'
    })
  })

  // Ordenar eventos por timestamp
  events.sort((a, b) => {
    const dateA = new Date(a.timestamp)
    const dateB = new Date(b.timestamp)
    return isNaN(dateA) ? 1 : isNaN(dateB) ? -1 : dateA - dateB
  })

  function getColorClasses(color) {
    switch (color) {
      case 'indigo':
        return {
          bg: 'bg-indigo-100',
          text: 'text-indigo-600',
          line: 'border-indigo-200'
        }
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          line: 'border-purple-200'
        }
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          line: 'border-blue-200'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          line: 'border-gray-200'
        }
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum evento registrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => {
        const colors = getColorClasses(event.color)
        const isLast = index === events.length - 1
        
        return (
          <div key={index} className="relative">
            {/* Linha conectora */}
            {!isLast && (
              <div className={`absolute left-4 top-8 w-0.5 h-6 border-l-2 border-dashed ${colors.line}`}></div>
            )}
            
            {/* Evento */}
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center ${colors.text}`}>
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <time className="text-sm text-gray-500">
                    {typeof event.timestamp === 'string' && event.timestamp.includes('/') 
                      ? event.timestamp 
                      : new Date(event.timestamp).toLocaleString('pt-BR')
                    }
                  </time>
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}