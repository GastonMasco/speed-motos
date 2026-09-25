import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Download, Share2, CheckCircle, Wrench, Calendar, User, FileText, Phone } from 'lucide-react'
import { formatBs, formatDate } from '../../utils/formatters'
import { useBusinessConfig } from '../../hooks/useBusinessConfig'

export const ReceiptModal = ({
  isOpen,
  onClose,
  sale = null,
}) => {
  const { config } = useBusinessConfig()

  if (!sale) return null

  const company = {
    NOMBRE: config.nombre_negocio || 'Speed Rao Motos',
    ESLOGAN: config.eslogan || 'Venta de Repuestos, Accesorios y Taller Especializado',
    DIRECCION: config.direccion || 'La Paz, Bolivia',
    TELEFONO: config.telefono || '+591 71234567',
    NIT: config.nit || '1028374029',
  }

  const items = sale.items || sale.sale_items || []
  const subtotalBs = Number(sale.subtotal ?? sale.total_bs ?? sale.total ?? 0)
  const descuentoBs = Number(sale.descuento ?? 0)
  const totalBs = Number(sale.total ?? sale.total_bs ?? 0)
  const numeroVenta = sale.numero_venta || (sale.id ? `VEN-${sale.id.substring(0, 6).toUpperCase()}` : 'VEN-000000')

  // Compartir por WhatsApp (Web Share API o URL wa.me)
  const handleShareWhatsApp = () => {
    let text = `🏍️ *${company.NOMBRE}* - Comprobante de Venta\n`
    text += `📄 *N° Venta:* ${numeroVenta}\n`
    text += `📅 *Fecha:* ${formatDate(sale.created_at)}\n`
    text += `👤 *Cliente:* ${sale.cliente_nombre || sale.client_name || 'Cliente Ocasional'}\n`
    if (sale.cliente_nit || sale.client_ci_nit) text += `🆔 *NIT/CI:* ${sale.cliente_nit || sale.client_ci_nit}\n`
    text += `💳 *Pago:* ${(sale.metodo_pago || sale.payment_method || 'Efectivo').toUpperCase()}\n`
    text += `----------------------------------------\n`
    text += `*DETALLE DE REPUESTOS:*\n`

    items.forEach((item) => {
      const nombreProd = item.producto?.nombre || item.productos?.name || item.nombre || 'Repuesto'
      const cant = item.cantidad || item.quantity || 1
      const pUnit = formatBs(item.precio_unitario || item.unit_price_bs || 0)
      const sub = formatBs(item.subtotal_linea || item.subtotal_bs || 0)
      text += `• ${cant}x ${nombreProd} (${pUnit}) = ${sub}\n`
    })

    text += `----------------------------------------\n`
    if (descuentoBs > 0) text += `*Descuento:* -${formatBs(descuentoBs)}\n`
    text += `*TOTAL CANCELADO:* ${formatBs(totalBs)}\n\n`
    text += `¡Gracias por tu compra en ${company.NOMBRE}!`

    if (navigator.share) {
      navigator.share({
        title: `Comprobante ${numeroVenta} - ${company.NOMBRE}`,
        text: text,
      }).catch(err => console.log('Share cancelado:', err))
    } else {
      const encodedText = encodeURIComponent(text)
      window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    }
  }

  // Generar y descargar PDF con jsPDF
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Encabezado
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(225, 29, 72) // Rose-600
      doc.text(company.NOMBRE, 14, 20)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(company.ESLOGAN, 14, 25)
      doc.text(`Dirección: ${company.DIRECCION} | Tel: ${company.TELEFONO}`, 14, 30)
      doc.text(`NIT: ${company.NIT}`, 14, 35)

      // Línea divisoria
      doc.setDrawColor(200)
      doc.line(14, 38, 196, 38)

      // Datos de la Venta
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.text(`COMPROBANTE DE VENTA: ${numeroVenta}`, 14, 46)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.text(`Fecha: ${formatDate(sale.created_at)}`, 14, 52)
      doc.text(`Vendedor: ${sale.vendedor_nombre || sale.profiles?.nombre_completo || sale.profiles?.full_name || 'Vendedor Speed Rao'}`, 14, 57)
      doc.text(`Cliente: ${sale.cliente_nombre || sale.client_name || 'Cliente Ocasional'}`, 120, 52)
      doc.text(`NIT/CI: ${sale.cliente_nit || sale.client_ci_nit || 'Sin NIT'}`, 120, 57)
      doc.text(`Método Pago: ${(sale.metodo_pago || sale.payment_method || 'Efectivo').toUpperCase()}`, 120, 62)

      // Tabla de Items
      let y = 70
      doc.setFillColor(240, 240, 240)
      doc.rect(14, y, 182, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Producto / Repuesto', 16, y + 5.5)
      doc.text('Cant.', 120, y + 5.5)
      doc.text('P. Unit (Bs.)', 145, y + 5.5)
      doc.text('Subtotal (Bs.)', 172, y + 5.5)

      y += 12
      doc.setFont('helvetica', 'normal')

      items.forEach((item) => {
        const nombreProd = item.producto?.nombre || item.productos?.name || item.nombre || 'Repuesto'
        const cant = item.cantidad || item.quantity || 1
        const pUnit = (item.precio_unitario || item.unit_price_bs || 0).toFixed(2)
        const sub = (item.subtotal_linea || item.subtotal_bs || 0).toFixed(2)

        doc.text(nombreProd.substring(0, 45), 16, y)
        doc.text(String(cant), 122, y)
        doc.text(pUnit, 148, y)
        doc.text(sub, 175, y)
        y += 7
      })

      // Totales
      y += 5
      doc.line(14, y, 196, y)
      y += 6

      if (descuentoBs > 0) {
        doc.text(`Subtotal: ${formatBs(subtotalBs)}`, 140, y)
        y += 5
        doc.text(`Descuento: -${formatBs(descuentoBs)}`, 140, y)
        y += 5
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(16, 185, 129) // Emerald-500
      doc.text(`TOTAL NETO: ${formatBs(totalBs)}`, 140, y)

      // Pie de página
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text('¡Gracias por su preferencia! Speed Rao Motos - Garantía y Calidad en Repuestos.', 14, 280)

      doc.save(`Comprobante_${numeroVenta}.pdf`)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF: ' + err.message)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle size={20} />
          <span>Comprobante de Venta</span>
        </div>
      }
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* Encabezado del Comprobante */}
        <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
          <div className="text-center border-b border-gray-800/80 pb-3">
            <h2 className="text-base font-black text-rose-500 tracking-wide uppercase">
              {company.NOMBRE}
            </h2>
            <p className="text-[10px] text-gray-400">{company.ESLOGAN}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {company.DIRECCION} | Tel: {company.TELEFONO} | NIT: {company.NIT}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
            <div>
              <span className="text-gray-500 block">N° Venta:</span>
              <strong className="font-mono text-rose-400">{numeroVenta}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Fecha:</span>
              <span>{formatDate(sale.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Cliente:</span>
              <strong>{sale.cliente_nombre || sale.client_name || 'Cliente Ocasional'}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">NIT / CI:</span>
              <span>{sale.cliente_nit || sale.client_ci_nit || 'Sin NIT'}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Repuestos */}
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/80 text-gray-400 text-[10px] uppercase font-semibold">
                <th className="p-2.5">Repuesto</th>
                <th className="p-2.5 text-center">Cant.</th>
                <th className="p-2.5 text-right">P.Unit</th>
                <th className="p-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-850/50">
                  <td className="p-2.5 font-medium">
                    {item.producto?.nombre || item.productos?.name || item.nombre || 'Repuesto'}
                  </td>
                  <td className="p-2.5 text-center font-bold">{item.cantidad || item.quantity}</td>
                  <td className="p-2.5 text-right font-mono text-gray-400">
                    {formatBs(item.precio_unitario || item.unit_price_bs)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-gray-100">
                    {formatBs(item.subtotal_linea || item.subtotal_bs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de Totales */}
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1 text-right">
          {descuentoBs > 0 && (
            <>
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Subtotal:</span>
                <span className="font-mono">{formatBs(subtotalBs)}</span>
              </div>
              <div className="flex justify-between text-rose-400 text-[11px]">
                <span>Descuento:</span>
                <span className="font-mono">-{formatBs(descuentoBs)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-800 text-sm font-extrabold">
            <span className="text-gray-200">TOTAL CANCELADO ({sale.metodo_pago || sale.payment_method}):</span>
            <span className="text-lg text-emerald-400">{formatBs(totalBs)}</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-800">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 text-emerald-400 border-emerald-900 hover:bg-emerald-950/40"
          >
            <Share2 size={16} />
            Compartir WhatsApp
          </Button>

          <Button
            fullWidth
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  )
}
