import { useState, useEffect } from 'react'

/**
 * Hook para aplicar debounce a un valor (ej. campo de búsqueda)
 * @param {any} value - El valor a observar
 * @param {number} delay - Tiempo de espera en milisegundos (por defecto 300ms)
 * @returns {any} El valor debounced
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
