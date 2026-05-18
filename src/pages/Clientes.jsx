import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit3, Trash2, FileText, Search, User, Phone, Mail, Hash } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { useClientes } from '../hooks/useClientes'
import { validarNIF } from '../lib/validacoes'

const emptyCliente = { nome: '', nif: '', morada: '', codigo_postal: '', localidade: '', telefone: '', email: '' }

export default function Clientes() {
  const navigate = useNavigate()
  const { clientes, loading, saveCliente, deleteCliente, refetch } = useClientes()
  const [pesquisa, setPesquisa] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyCliente)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const filtrados = clientes.filter(c => {
    if (!pesquisa) return true
    const q = pesquisa.toLowerCase()
    return c.nome?.toLowerCase().includes(q) || c.nif?.includes(q) || c.email?.toLowerCase().includes(q)
  })

  const openNew = () => { setForm(emptyCliente); setErrors({}); setModal(true) }
  const openEdit = (c) => { setForm({ ...c }); setErrors({}); setModal(true) }

  const validate = () => {
    const errs = {}
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório'
    if (form.nif && !validarNIF(form.nif)) errs.nif = 'NIF inválido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    await saveCliente(form)
    await refetch()
    setSaving(false)
    setModal(false)
  }

  const handleDelete = async () => {
    await deleteCliente(deleteId)
    setDeleteId(null)
  }

  return (
    <AppLayout title="Clientes">
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openNew}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, NIF ou email..."
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">A carregar...</div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <User size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">
              {clientes.length === 0 ? 'Ainda não tem clientes.' : 'Nenhum resultado encontrado.'}
            </p>
            {clientes.length === 0 && (
              <button onClick={openNew} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                Adicionar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrados.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.nome}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      {c.nif && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Hash size={11} />{c.nif}
                        </span>
                      )}
                      {c.telefone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone size={11} />{c.telefone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail size={11} />{c.email}
                        </span>
                      )}
                    </div>
                    {(c.localidade || c.morada) && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{[c.morada, c.localidade].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/?cliente=${c.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Ver orçamentos"
                    >
                      <FileText size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Editar Cliente' : 'Novo Cliente'} size="md">
        <div className="space-y-4">
          <Input
            label="Nome / Razão social *"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
            placeholder="Nome completo ou empresa"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="NIF"
              value={form.nif || ''}
              onChange={e => setForm(f => ({ ...f, nif: e.target.value.replace(/\D/g, '') }))}
              error={errors.nif}
              placeholder="123456789"
              maxLength={9}
            />
            <Input
              label="Telefone"
              value={form.telefone || ''}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="912 345 678"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email || ''}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="cliente@exemplo.pt"
          />
          <Input
            label="Morada"
            value={form.morada || ''}
            onChange={e => setForm(f => ({ ...f, morada: e.target.value }))}
            placeholder="Rua, número, andar..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código postal"
              value={form.codigo_postal || ''}
              onChange={e => setForm(f => ({ ...f, codigo_postal: e.target.value }))}
              placeholder="1000-001"
            />
            <Input
              label="Localidade"
              value={form.localidade || ''}
              onChange={e => setForm(f => ({ ...f, localidade: e.target.value }))}
              placeholder="Lisboa"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModal(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-gray-600 hover:bg-bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        message="Tem a certeza que deseja eliminar este cliente? Os orçamentos associados não serão eliminados."
        confirmLabel="Eliminar"
        danger
      />
    </AppLayout>
  )
}
