import { memo, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export const Input = memo(forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type

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
          type={currentType}
          className={`
            block w-full rounded-lg bg-gray-800 border text-gray-100 placeholder-gray-500 text-sm py-2 px-3 focus:outline-none focus:ring-2 transition-colors duration-150
            ${Icon ? 'pl-10' : 'pl-3'}
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-700 focus:ring-rose-500 focus:border-rose-500'}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
            tabIndex={-1}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
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
