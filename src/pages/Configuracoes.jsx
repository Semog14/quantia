import React, { useState, useEffect } from 'react'
import { Save, Upload, Building2, Settings, FileText } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Input, { Textarea, Select } from '../components/ui/Input'
import { useEmpresa } from '../hooks/useEmpresa'
import { validarNIF } from '../lib/validacoes'

export default function Configuracoes() {
  const { empresa, saving, saveEmpresa, uploadLogo } = useEmpresa()
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [logoFile, setLogoFile] = useState(null)

  useEffect(() => {
    if (empresa) setForm({ ...empresa })
  }, [empresa])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const validate = () => {
    const errs = {}
    if (!form.nome?.trim()) errs.nome = 'Nome obrigatório'
    if (form.nif && !validarNIF(form.nif)) errs.nif = 'NIF inválido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    let logoUrl = form.logo_url
    if (logoFile) {
      logoUrl = await uploadLogo(logoFile) || logoUrl
    }
    await saveEmpresa({ ...form, logo_url: logoUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => set('logo_url', ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  if (!empresa) return (
    <AppLayout title="Configurações">
      <div className="p-6 text-center text-gray-400 text-sm">A carregar...</div>
    </AppLayout>
  )

  return (
    <AppLayout title="Configurações">
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-sm text-gray-500 mt-0.5">Dados da empresa e preferências de orçamentação</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-success text-sm rounded-lg px-4 py-3 mb-4">
            Configurações guardadas com sucesso.
          </div>
        )}

        {/* Company data */}
        <div className="bg-white rounded-xl border border-border p-5 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <Building2 size={16} className="text-primary" />
            Dados da Empresa
          </h2>

          {/* Logo */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logótipo</label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-14 object-contain border border-border rounded-lg p-1" />
              ) : (
                <div className="w-14 h-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-gray-300">
                  <Building2 size={20} />
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-gray-600 hover:bg-bg-secondary transition-colors cursor-pointer">
                <Upload size={14} />
                Carregar logo
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da empresa *"
              value={form.nome || ''}
              onChange={e => set('nome', e.target.value)}
              error={errors.nome}
            />
            <Input
              label="NIF"
              value={form.nif || ''}
              onChange={e => set('nif', e.target.value.replace(/\D/g, ''))}
              error={errors.nif}
              maxLength={9}
            />
            <div className="sm:col-span-2">
              <Input
                label="Morada"
                value={form.morada || ''}
                onChange={e => set('morada', e.target.value)}
              />
            </div>
            <Input
              label="Código postal"
              value={form.codigo_postal || ''}
              onChange={e => set('codigo_postal', e.target.value)}
            />
            <Input
              label="Localidade"
              value={form.localidade || ''}
              onChange={e => set('localidade', e.target.value)}
            />
            <Input
              label="Telefone"
              value={form.telefone || ''}
              onChange={e => set('telefone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email || ''}
              onChange={e => set('email', e.target.value)}
            />
            <Input
              label="Website"
              value={form.website || ''}
              onChange={e => set('website', e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Nº de alvará de construção"
              value={form.alvara || ''}
              onChange={e => set('alvara', e.target.value)}
            />
          </div>
        </div>

        {/* Budget defaults */}
        <div className="bg-white rounded-xl border border-border p-5 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <Settings size={16} className="text-primary" />
            Configurações de Orçamento
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Imprevistos padrão</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={form.config_imprevistos ?? 5}
                  onChange={e => set('config_imprevistos', parseFloat(e.target.value) || 0)}
                  className="w-full border border-border rounded-lg px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Margem padrão</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={form.config_margem ?? 10}
                  onChange={e => set('config_margem', parseFloat(e.target.value) || 0)}
                  className="w-full border border-border rounded-lg px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IVA padrão</label>
              <select
                value={form.config_iva || '23'}
                onChange={e => set('config_iva', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="23">23%</option>
                <option value="6">6%</option>
                <option value="inversao">Inversão SP</option>
                <option value="isento">Isento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validade (dias)</label>
              <input
                type="number" min="1"
                value={form.config_validade ?? 30}
                onChange={e => set('config_validade', parseInt(e.target.value) || 30)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* PDF texts */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <FileText size={16} className="text-primary" />
            Textos do PDF
          </h2>
          <div className="space-y-4">
            <Textarea
              label="Texto de rodapé padrão"
              value={form.config_rodape || ''}
              onChange={e => set('config_rodape', e.target.value)}
              rows={3}
              placeholder="Condições de pagamento, prazo de execução, etc."
            />
            <Textarea
              label="Condições gerais"
              value={form.config_condicoes || ''}
              onChange={e => set('config_condicoes', e.target.value)}
              rows={4}
              placeholder="Condições gerais de prestação de serviços..."
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
