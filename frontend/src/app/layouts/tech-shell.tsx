import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  DatabaseZap,
  LayoutDashboard,
  Printer,
  Wrench,
} from 'lucide-react'
import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const techNavItems = [
  { label: 'Dashboard', href: '/tech/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/tech/users', icon: Wrench },
  { label: 'Printers', href: '/tech/printers', icon: Printer },
  { label: 'Alerts', href: '/tech/alerts', icon: Bell },
]

export function TechShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const sectionTitle =
    techNavItems.find((item) => location.pathname.startsWith(item.href))?.label ?? 'Technician'

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

      <div className="mx-auto grid min-h-[calc(100vh-2.25rem)] max-w-[1800px] grid-cols-1 lg:h-[calc(100vh-2.25rem)] lg:min-h-0 lg:grid-cols-[248px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex flex-col border-b border-line/70 bg-white/70 px-4 py-5 backdrop-blur lg:h-full lg:border-r lg:border-b-0">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <div className="ui-kicker">Print Management</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">CCM Tech</div>
              <p className="mt-2 max-w-[16rem] text-sm text-slate-500">Operations console</p>
            </div>
            <DatabaseZap className="mt-1 size-5 text-accent-500" />
          </div>

          <nav className="mt-6 flex-1 space-y-1.5">
            {techNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 overflow-hidden border px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'border-ink-950 bg-ink-950 text-white'
                      : 'border-transparent text-slate-600 hover:border-line hover:bg-white hover:text-ink-950',
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

          <div className="mt-auto border-t border-line pt-5">
            <div className="ui-kicker">Operator</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold text-ink-950">Sarah Tech</div>
                <div className="text-slate-500">Operations</div>
              </div>
              <div className="rounded-full bg-accent-100 px-2.5 py-1 text-[0.7rem] font-semibold text-accent-700">
                Online
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <header className="border-b border-line/80 bg-white/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="ui-kicker">{sectionTitle}</div>
                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
                    Technician Workspace
                  </h1>
                </div>
              </div>
            </div>
          </header>

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
