import React from 'react'
import { HardHat } from 'lucide-react'
import { useAuthStore } from '../../lib/store'

export default function Topbar({ title }) {
  const { empresa } = useAuthStore()
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <HardHat size={15} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm">Quantia</span>
      </div>
      {title && <h1 className="text-sm font-semibold text-gray-700">{title}</h1>}
      <div className="w-16" />
    </header>
  )
}
