import React from 'react'

const estadoConfig = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
  enviado: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  recusado: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
  expirado: { label: 'Expirado', className: 'bg-yellow-100 text-yellow-700' },
}

export function EstadoBadge({ estado }) {
  const config = estadoConfig[estado] || estadoConfig.rascunho
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}
