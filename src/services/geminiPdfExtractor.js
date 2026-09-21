import { getGeminiModel } from '../config/gemini'

/**
 * Convierte un objeto File a formato base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64String = reader.result.split(',')[1]
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Extrae repuestos de una lista de precios PDF usando Gemini 1.5 Flash
 * @param {File} pdfFile - Archivo PDF del proveedor
 * @returns {Promise<Array>} Lista de objetos con los repuestos extraídos
 */
export const extractProductsFromPdf = async (pdfFile) => {
  if (!pdfFile) throw new Error('No se ha proporcionado un archivo PDF válido.')

  try {
    const base64Data = await fileToBase64(pdfFile)

    // Inicializar modelo Gemini 1.5 Flash
    const model = getGeminiModel('gemini-1.5-flash')

    const prompt = `
Eres un experto en extracción de catálogos y listas de precios de repuestos para motocicletas en Bolivia para la empresa "Speed Rao Motos".
Analiza minuciosamente el archivo PDF adjunto y extrae TODOS los repuestos contenidos en las listas de precios.

REGLAS CRÍTICAS DE EXTRACCIÓN Y FORMATO:
1. **Múltiples Subtablas / Categorías**: Un PDF puede tener múltiples secciones o subtablas con sus propios títulos/encabezados (ej. "SS48", "RP38", "BS32", "Llantas", "Frenos", "Plásticos"). Identifica la categoría y marca sugerida correspondiente para cada producto.
2. **Productos "AGOTADO"**: Si un producto aparece marcado como "AGOTADO", "SIN STOCK" o no tiene precio numérico disponible, NO pongas precio 0. Establece "precio_costo": null y "estado_producto": "agotado".
3. **Columnas "ANTES / AHORA" (Ofertas)**: Si la tabla contiene precios "ANTES" y "AHORA", utiliza SIEMPRE el valor de "AHORA" como "precio_costo" y marca "estado_producto": "oferta_especial".
4. **Compatibilidad de Moto en el Nombre**: Extrae del nombre del repuesto los modelos de motocicletas compatibles (ej. en "GUARDABARRO DEL. CRF 230 MY23 NEGRO", la compatibilidad es ["CRF230"]). Limpia los nombres de modelo (ej. "CRF230", "XR200", "Tornado250", "CB190R", "CG125"). Si es universal o no aplica, retorna array vacío.
5. **Unidad de Medida**: Asigna una de las siguientes opciones válidas: "PZA", "PAR", "JGO", "KIT". Si no se especifica, usa "PZA".
6. **Grado de Confianza (confianza_ia)**:
   - "alta": Datos claros, código, precio y nombre completos.
   - "media": Algunos campos inferidos.
   - "baja": Faltan columnas, texto borroso o formato confuso.

FORMATO DE RESPUESTA REQUERIDO (JSON estricto):
Retorna EXCLUSIVAMENTE un arreglo JSON con el siguiente esquema por cada producto detectado:
[
  {
    "codigo_proveedor": "Código o SKU del proveedor (texto o vacio)",
    "nombre": "Nombre descriptivo del repuesto",
    "marca": "Marca del repuesto (ej: RAOPKS, GPR, Rinaldi, Vedamotors, Generico)",
    "categoria_sugerida": "frenos | llantas | transmision | plasticos | filtros | lubricantes | electricidad | motor | otros",
    "compatibilidad_sugerida": ["CRF230", "XR200"],
    "unidad": "PZA | PAR | JGO | KIT",
    "precio_costo": 45.50,
    "estado_producto": "disponible | agotado | oferta_especial",
    "confianza_ia": "alta | media | baja"
  }
]
`

    const pdfPart = {
      inlineData: {
        data: base64Data,
        mimeType: 'application/pdf',
      },
    }

    const result = await model.generateContent([prompt, pdfPart], {
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const responseText = result.response.text()
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const extractedItems = JSON.parse(cleanJson)

    if (!Array.isArray(extractedItems)) {
      throw new Error('La respuesta de la IA no es una lista de productos válida.')
    }

    return extractedItems
  } catch (err) {
    console.error('Error procesando PDF con Gemini AI:', err)
    throw new Error('Error al analizar el PDF con IA: ' + (err.message || 'Verifica la API Key de Gemini o el formato del archivo.'))
  }
}
