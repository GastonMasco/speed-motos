/**
 * Convierte un archivo de imagen (PNG, JPG, etc.) a un Blob comprimido en formato WebP.
 * Redimensiona a un máximo de 800px de ancho para minimizar uso de almacenamiento y ancho de banda.
 */
export const compressToWebP = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'))
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
              const webpFile = new File([blob], fileName, { type: 'image/webp' })
              resolve(webpFile)
            } else {
              reject(new Error('No se pudo convertir la imagen a WebP.'))
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = (err) => reject(err)
    }

    reader.onerror = (err) => reject(err)
  })
}
