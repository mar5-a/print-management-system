import { motion } from 'framer-motion'
import {
  Clock3,
  FileClock,
  LayoutDashboard,
  Printer,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'

const portalNavItems = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Submit Job', href: '/portal/submit-job', icon: Upload },
  { label: 'History', href: '/portal/history', icon: FileClock },
]

export function UserShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const portalUserProfile = getCurrentPortalUserProfile()
  const sectionTitle =
    portalNavItems.find((item) => location.pathname.startsWith(item.href))?.label ?? 'Portal'

  return (
    <div className="min-h-screen bg-transparent text-ink-950 lg:h-screen lg:overflow-hidden">
      <div className="h-9 border-b border-sky-600/20 bg-ink-950 text-[0.78rem] text-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 font-medium">
            <Printer className="size-3.5" />
            <span>Print Portal</span>
            <span className="hidden text-white/60 sm:inline">Standard user workspace</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/75">
            <span>Retention 24h</span>
            <span className="hidden sm:inline">AD linked</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-2.25rem)] max-w-[1600px] grid-cols-1 lg:h-[calc(100vh-2.25rem)] lg:min-h-0 lg:grid-cols-[232px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex flex-col border-b border-line/70 bg-white/70 px-4 py-5 backdrop-blur lg:h-full lg:border-r lg:border-b-0">
          <div className="border-b border-line pb-5">
            <div className="ui-kicker">Your Portal</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Print Portal</div>
            <p className="mt-2 max-w-[16rem] text-sm text-slate-500">
              Submit jobs, watch quota usage, and review your own print records.
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-1.5">
            {portalNavItems.map((item) => (
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
                        layoutId="active-portal-pill"
                        className="absolute inset-y-0 left-0 w-1 bg-accent-500"
                      />
                    ) : null}
                    <item.icon className="relative size-4" />
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-line pt-5">
            <div className="ui-kicker">Signed in</div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-ink-950">{portalUserProfile.displayName}</div>
                <div className="text-sm text-slate-500">
                  {portalUserProfile.role} · {portalUserProfile.department}
                </div>
              </div>
              <div className="rounded-full bg-accent-100 px-2.5 py-1 text-[0.7rem] font-semibold text-accent-700">
                Active
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <header className="border-b border-line/80 bg-white/75 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="ui-kicker">{sectionTitle}</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">
                  Your personal print management overview
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <div className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2">
                  <ShieldCheck className="size-4 text-accent-600" />
                  Own records only
                </div>
                <div className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2">
                  <Clock3 className="size-4 text-sky-600" />
                  History within two clicks
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <div>{outlet}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
