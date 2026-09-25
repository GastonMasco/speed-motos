import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Wrench, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function RegisterPage() {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { registerSeller } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      await registerSeller({
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        password,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/pendiente')
      }, 2500)
    } catch (err) {
      setError(err.message || 'Error al completar la solicitud de registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-900/40">
            <Wrench size={30} />
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">REGISTRO DE VENDEDOR</h1>
          <p className="text-xs text-gray-400 mt-1">Solicita acceso al sistema de ventas Motos Service Oraqueni</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-emerald-400" />
            <h3 className="font-bold text-base text-gray-100">¡Registro Completado!</h3>
            <p className="text-xs text-emerald-300 leading-relaxed font-medium">
              "Tu cuenta fue creada, espera la aprobación del administrador"
            </p>
            <p className="text-[11px] text-gray-400">Redirigiendo a la pantalla de espera...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre Completo *"
              type="text"
              icon={User}
              placeholder="Ej: Pedro Gonzales"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              required
            />

            <Input
              label="Teléfono / Celular *"
              type="tel"
              icon={Phone}
              placeholder="Ej: 71234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico *"
              type="email"
              icon={Mail}
              placeholder="vendedor@speedrao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña *"
              type="password"
              icon={Lock}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading} className="mt-2 py-2.5">
              Solicitar Registro
            </Button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
