import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 6
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  const ihdrChunk = createChunk('IHDR', ihdrData)

  const lineSize = 1 + width * 4
  const rawData = Buffer.alloc(height * lineSize)

  const cx = width / 2
  const cy = height / 2
  const outerRadius = width * 0.46
  const innerRadius = width * 0.38

  for (let y = 0; y < height; y++) {
    const rowOffset = y * lineSize
    rawData[rowOffset] = 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= outerRadius) {
        if (dist <= innerRadius) {
          // Rose red background (#e11d48)
          rawData[pxOffset] = 225
          rawData[pxOffset + 1] = 29
          rawData[pxOffset + 2] = 72
          rawData[pxOffset + 3] = 255
        } else {
          // Dark gold ring border (#f59e0b)
          rawData[pxOffset] = 245
          rawData[pxOffset + 1] = 158
          rawData[pxOffset + 2] = 11
          rawData[pxOffset + 3] = 255
        }
      } else {
        // Dark background (#111827)
        rawData[pxOffset] = 17
        rawData[pxOffset + 1] = 24
        rawData[pxOffset + 2] = 39
        rawData[pxOffset + 3] = 255
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData)
  const idatChunk = createChunk('IDAT', compressedData)
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

function createChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(4 + 4 + len + 4)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4)
  data.copy(buf, 8)

  const crcVal = crc32(buf.subarray(4, 8 + len))
  buf.writeUInt32BE(crcVal, 8 + len)
  return buf
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

const publicDir = 'd:/Antigravity_Paginas/App_SpeedMotos/public'
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192))
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512))
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180))
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64))

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#111827" rx="100"/>
  <circle cx="256" cy="256" r="200" fill="#e11d48" stroke="#f59e0b" stroke-width="16"/>
  <path d="M 200 310 L 310 200 M 310 200 C 330 180 340 150 320 130 C 300 110 270 120 250 140 L 170 220 C 150 240 150 270 170 290 Z" fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
fs.writeFileSync(path.join(publicDir, 'masked-icon.svg'), svgContent)

console.log('Icons created in public directory!')
