import { memo, useState } from 'react'

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%234B5563" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'

export const LazyImage = memo(({
  src,
  alt = 'Repuesto Motos Service Oraqueni',
  className = '',
  fallbackSrc = DEFAULT_PLACEHOLDER,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleError = () => {
    if (!error) {
      setError(true)
      setImageSrc(fallbackSrc)
    }
  }

  return (
    <div className={`relative overflow-hidden bg-gray-800 ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center text-gray-600">
          <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  )
})

LazyImage.displayName = 'LazyImage'
