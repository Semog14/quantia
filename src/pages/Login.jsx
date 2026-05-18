import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'reset'

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email ou password incorretos.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/nova-password',
    })
    if (err) setError('Erro ao enviar email de recuperação.')
    else setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <HardHat size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quantia</h1>
          <p className="text-sm text-gray-500 mt-1">Orçamentação para Construção Civil</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          {mode === 'login' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Entrar na conta</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                      placeholder="nome@empresa.pt"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'A entrar...' : 'Entrar'}
                </button>
              </form>

              <button
                onClick={() => { setMode('reset'); setError('') }}
                className="w-full text-center text-sm text-primary hover:text-primary-dark mt-4 transition-colors"
              >
                Esqueci a password
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Recuperar password</h2>
              <p className="text-sm text-gray-500 mb-6">Introduza o seu email para receber o link de recuperação.</p>
              {resetSent ? (
                <div className="text-center">
                  <p className="text-sm text-success bg-green-50 border border-green-200 rounded-lg px-3 py-3 mb-4">
                    Email enviado! Verifique a sua caixa de entrada.
                  </p>
                  <button onClick={() => { setMode('login'); setResetSent(false) }} className="text-sm text-primary">
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                      placeholder="nome@empresa.pt"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-danger">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? 'A enviar...' : 'Enviar link de recuperação'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                    Voltar ao login
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Quantia © {new Date().getFullYear()} — Software de orçamentação para construção civil
        </p>
      </div>
    </div>
  )
}
