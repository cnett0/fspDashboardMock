import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Map,
  BarChart2,
  Database,
  Layers,
  Globe,
  Zap,
  ShieldCheck,
  Scale,
  TrendingUp,
  LineChart,
  Settings,
  FolderCog,
  Activity,
} from 'lucide-react'

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/grid', label: 'Grid Ops', icon: Map },
  { to: '/markets', label: 'Markets', icon: BarChart2 },
  { to: '/assets', label: 'Assets', icon: Database },
  { to: '/assets/manage', label: 'Manage', icon: FolderCog },
  { to: '/pools', label: 'Pools', icon: Layers },
  { to: '/pools/regions', label: 'Regions', icon: Globe },
  { to: '/dispatch', label: 'Dispatch', icon: Zap },
  { to: '/cbp', label: 'CBP', icon: ShieldCheck },
  { to: '/balancing', label: 'Balancing', icon: Scale },
  { to: '/pricing', label: 'Pricing', icon: TrendingUp },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  // { to: '/envelio', label: 'Envelio', icon: Activity },
  // { to: '/settings', label: 'Settings', icon: Settings },
]

export function LeftNav() {
  return (
    <nav className="w-14 flex flex-col bg-gradient-to-b from-gray-600 to-gray-900 border-r border-gray-800 flex-shrink-0 py-2 overflow-y-auto overflow-x-hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/assets'}
          title={label}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center py-2.5 mx-1 rounded-lg transition-all duration-200 group relative',
              isActive
                ? 'bg-gradient-to-r from-green-300 to-green-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-green-100/10 hover:text-black',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={17} />
              <span className={clsx(
                'text-2xs mt-1 font-medium text-center leading-tight',
                isActive ? 'text-black' : 'text-slate-500 group-hover:text-slate-200',
              )}>
                {label.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
