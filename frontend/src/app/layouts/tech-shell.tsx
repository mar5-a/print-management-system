import { motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  DatabaseZap,
  LayoutDashboard,
  LogOut,
  Printer,
  Wrench,
} from 'lucide-react'
import { NavLink, useNavigate, useOutlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth'

const techNavItems = [
  { label: 'Dashboard', href: '/tech/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/tech/users', icon: Wrench },
  { label: 'Printers', href: '/tech/printers', icon: Printer },
  { label: 'Alerts', href: '/tech/alerts', icon: Bell },
]

export function TechShell() {
  const navigate = useNavigate()
  const outlet = useOutlet()

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) {
      return
    }

    logout()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="min-h-screen bg-transparent text-ink-950 lg:h-screen lg:overflow-hidden">
      <div className="h-9 border-b border-accent-600/20 bg-accent-700 text-[0.78rem] text-white">
        <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 font-medium">
            <Wrench className="size-3.5" />
            <span>Technician build</span>
            <span className="hidden text-white/60 sm:inline">
              Current scope: user access and printer monitoring
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/80">
            <span>Last sync 09:42</span>
            <span className="hidden sm:inline">AD stable</span>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-2.25rem)] max-w-[1800px] grid-cols-1 lg:h-[calc(100vh-2.25rem)] lg:min-h-0 lg:grid-cols-[248px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-b border-line/70 bg-[#111827] px-4 py-4 backdrop-blur lg:h-full lg:border-r lg:border-b-0">
          <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-700 pb-4">
            <div>
              <div className="ui-kicker text-slate-300">Print Management</div>
              <div className="mt-1.5 text-xl font-semibold tracking-tight text-white">CCM Tech</div>
              <p className="mt-1 text-sm text-slate-400">Operations console</p>
            </div>
            <DatabaseZap className="mt-1 size-5 text-accent-500" />
          </div>

          <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 lg:pb-24">
            {techNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 overflow-hidden border px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'border-ink-950 bg-ink-950 text-white'
                      : 'border-transparent text-slate-300 hover:border-line hover:bg-slate-700 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.div
                        layoutId="active-tech-pill"
                        className="absolute inset-y-0 left-0 w-1 bg-accent-500"
                      />
                    ) : null}
                    <item.icon className="relative size-4" />
                    <span className="relative">{item.label}</span>
                    <ChevronRight className="relative ml-auto size-4 opacity-50" />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 shrink-0 border-t border-slate-700 bg-[#111827] pt-3 lg:fixed lg:bottom-4 lg:left-4 lg:z-20 lg:mt-0 lg:w-[216px]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="ui-kicker text-slate-300">Operator</div>
                <div className="mt-1 truncate font-semibold text-white">Sarah Tech</div>
                <div className="truncate text-slate-400">Operations · Online</div>
              </div>
              <button className="ui-button-secondary h-9 shrink-0 px-3" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <main className="px-4 py-5 sm:px-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <div>{outlet}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
