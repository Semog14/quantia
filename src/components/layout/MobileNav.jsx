import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Users, Settings } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/orcamentos/novo', icon: PlusCircle, label: 'Novo', primary: true },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/configuracoes', icon: Settings, label: 'Config' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 flex">
      {links.map(({ to, icon: Icon, label, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors ${
              primary
                ? 'text-primary'
                : isActive
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
