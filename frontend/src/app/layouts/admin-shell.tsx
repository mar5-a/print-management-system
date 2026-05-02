import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Bell,
  ChevronRight,
  DatabaseZap,
  FileText,
  GitBranch,
  LayoutDashboard,
  LayoutList,
  Logs,
  Monitor,
  Printer,
  Settings2,
  ShieldCheck,
  Wallet,
  LogOut,
  Users,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Groups', href: '/admin/groups', icon: LayoutList },
  { label: 'Accounts', href: '/admin/accounts', icon: Wallet },
  { label: 'Printers', href: '/admin/printers', icon: Printer },
  { label: 'Queues', href: '/admin/queues', icon: GitBranch },
  { label: 'Devices', href: '/admin/devices', icon: Monitor },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
  { label: 'Options', href: '/admin/options', icon: Settings2 },
  { label: 'Logs', href: '/admin/logs', icon: Logs },
  { label: 'About', href: '/admin/about', icon: BookOpen },
]

export function AdminShell() {
  const location = useLocation()
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
            <ShieldCheck className="size-3.5" />
            <span>Admin pilot build</span>
            <span className="hidden text-white/60 sm:inline">
              Current scope: admin operations
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/80 sm:flex">
              <span>Last sync 09:42</span>
              <span>AD stable</span>
            </div>
            <button className="inline-flex h-7 items-center gap-1.5 border border-white/20 px-2 text-[0.74rem] font-medium text-white/90 transition hover:bg-white/10">
              <Bell className="size-3.5" />
              Alerts
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-2.25rem)] max-w-[1800px] grid-cols-1 lg:h-[calc(100vh-2.25rem)] lg:min-h-0 lg:grid-cols-[248px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-0 flex-col border-b border-line/70 bg-[#111827] px-4 py-4 backdrop-blur lg:h-full lg:border-r lg:border-b-0">
          <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-700 pb-4">
            <div>
              <div className="ui-kicker text-slate-300">Print Management</div>
              <div className="mt-1.5 text-xl font-semibold tracking-tight text-white">CCM Admin</div>
              <p className="mt-1 text-sm text-slate-400">Operations console</p>
            </div>
            <DatabaseZap className="mt-1 size-5 text-accent-500" />
          </div>

          <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => (
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
                        layoutId="active-nav-pill"
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

          <div className="mt-4 shrink-0 border-t border-slate-700 pt-4">
            <div className="ui-kicker text-slate-300">Operator</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold text-white">David Admin</div>
                <div className="text-slate-400">Operations</div>
              </div>
              <div className="rounded-full bg-accent-100 px-2.5 py-1 text-[0.7rem] font-semibold text-accent-700">
                Online
              </div>
            </div>
            <button className="ui-button-secondary mt-4 w-full" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log Out
            </button>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <main className="px-4 py-5 sm:px-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
