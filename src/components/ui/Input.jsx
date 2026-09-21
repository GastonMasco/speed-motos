import { memo, forwardRef } from 'react'

export const Input = memo(forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            block w-full rounded-lg bg-gray-800 border text-gray-100 placeholder-gray-500 text-sm py-2 px-3 focus:outline-none focus:ring-2 transition-colors duration-150
            ${Icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-700 focus:ring-rose-500 focus:border-rose-500'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}))

Input.displayName = 'Input'
