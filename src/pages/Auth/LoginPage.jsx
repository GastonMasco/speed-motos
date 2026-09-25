import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Wrench, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, loginAsDirectAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await login(email, password)
      
      const userRol = res?.profile?.rol || 'vendedor'
      
      if (userRol === 'admin') {
        navigate('/admin/inicio')
      } else {
        navigate('/vendedor/inicio')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.')
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
          <h1 className="text-xl font-black tracking-wide text-white">SPEED RAO MOTOS</h1>
          <p className="text-xs text-gray-400 mt-1">Acceso al Sistema (Repuestos & Taller)</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2 leading-relaxed">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            icon={Mail}
            placeholder="mascogaston@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" fullWidth loading={loading} className="mt-2 py-2.5">
            Ingresar al Sistema
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          ¿Eres vendedor nuevo?{' '}
          <Link to="/registro" className="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4">
            Registrarme como vendedor
          </Link>
        </div>
      </div>
    </div>
  )
}
