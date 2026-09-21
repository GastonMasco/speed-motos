import { getGeminiModel } from '../config/gemini'

/**
 * Convierte un File a objeto inlineData Base64 para Gemini API
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1]
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf',
        },
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Procesa un archivo PDF o documento de proveedor con Gemini AI para extraer productos/repuestos
 */
export const extractProductsFromPdf = async (file) => {
  if (!file) throw new Error('Debes seleccionar un archivo PDF o imagen de factura.')

  try {
    const model = getGeminiModel('gemini-1.5-flash')
    const filePart = await fileToGenerativePart(file)

    const prompt = `
    Analiza este documento PDF o imagen de factura/proveedor de repuestos de motocicletas.
    Extrae todos los productos, repuestos y accesorios en formato JSON estricto.
    
    Debes devolver ÚNICAMENTE una matriz JSON limpia (sin etiquetas markdown \`\`\`json, sin texto explicativo), donde cada elemento sea un objeto con la siguiente estructura:
    [
      {
        "code": "CÓDIGO O SKU O VACÍO",
        "name": "NOMBRE EXACTO DEL REPUESTO O ACCESORIO",
        "description": "DESCRIPCIÓN O MODELO COMPATIBLE SI EXISTE",
        "price_bs": 0.0,  // Precio unitario estimado de venta en Bolivianos (si no existe calcula un 30% de ganancia sobre el costo)
        "cost_bs": 0.0,   // Costo unitario según factura en Bolivianos
        "stock": 1        // Cantidad según factura
      }
    ]
    
    Si los precios están en otra moneda o no se leen claramente, haz una estimación lógica en Bolivianos (Bs.).
    `

    const result = await model.generateContent([prompt, filePart])
    const response = await result.response
    const text = response.text()

    // Limpiar posibles etiquetas de markdown o texto extra
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const parsedProducts = JSON.parse(cleanedText)

    if (!Array.isArray(parsedProducts)) {
      throw new Error('Formato de respuesta inválido de Gemini AI.')
    }

    return parsedProducts
  } catch (err) {
    console.error('Error al procesar PDF con Gemini AI:', err)
    throw new Error('No se pudo procesar el PDF. Asegúrate de que contenga texto/imágenes legibles y que tu VITE_GEMINI_API_KEY esté configurada correctamente.')
  }
}
