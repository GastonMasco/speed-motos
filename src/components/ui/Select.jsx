import { memo } from 'react'

export const Select = memo(({
  label,
  options = [],
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        className={`
          block w-full rounded-lg bg-gray-800 border text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 transition-colors duration-150
          ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-700 focus:ring-rose-500 focus:border-rose-500'}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt.id} value={opt.value ?? opt.id} className="bg-gray-800 text-gray-100">
            {opt.label ?? opt.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
