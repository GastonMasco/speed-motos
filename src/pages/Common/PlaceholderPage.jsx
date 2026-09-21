import { Clock, Wrench } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function PlaceholderPage({ title = 'Módulo en Desarrollo', description = 'Esta sección será construida en la siguiente fase.' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <Card className="max-w-md w-full py-10 px-6 border-dashed border-gray-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Clock size={36} />
        </div>

        <Badge variant="warning" className="mx-auto">
          🚧 Próximamente - Fase Siguiente
        </Badge>

        <h2 className="text-xl font-extrabold text-gray-100">{title}</h2>

        <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
          {description}
        </p>

        <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <Wrench size={12} /> Speed Rao Motos PWA
        </div>
      </Card>
    </div>
  )
}
