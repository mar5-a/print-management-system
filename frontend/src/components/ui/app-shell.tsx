import { AnimatePresence, motion } from 'framer-motion'
import {
  Circle,
  LogOut,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode, useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { ProfilePanel, type ProfilePanelUserData } from '@/components/ui/profile-panel'

export interface AppShellNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface AppShellStatusItem {
  label: string
  value: string
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info'
}

interface AppShellProps {
  appTitle: string
  appSubtitle: string
  sidebarTitle: string
  sidebarSubtitle: string
  navItems: AppShellNavItem[]
  statusItems: AppShellStatusItem[]
  accountName: string
  accountMeta: string
  onLogout: () => void
  children: ReactNode
  maxWidthClassName?: string
  profileData?: ProfilePanelUserData
}

const toneClassNames: Record<NonNullable<AppShellStatusItem['tone']>, string> = {
  neutral: 'text-slate-500',
  success: 'text-emerald-500',
  warn: 'text-amber-500',
  danger: 'text-rose-500',
  info: 'text-cyan-500',
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.length === 0
    ? 'U'
    : parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
}

export function AppShell({
  appTitle,
  appSubtitle,
  sidebarTitle,
  sidebarSubtitle,
  navItems,
  statusItems,
  accountName,
  accountMeta,
  onLogout,
  children,
  maxWidthClassName = 'max-w-[1800px]',
  profileData,
}: AppShellProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const closeProfile = useCallback(() => setProfileOpen(false), [])

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="border-b border-topbar-border bg-topbar/95 backdrop-blur-sm">
        <div className={cn('mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6', maxWidthClassName)}>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-topbar-muted uppercase">
              {appSubtitle}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-topbar-foreground">
              {appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-topbar-border bg-panel text-topbar-foreground transition hover:border-slate-300 hover:bg-muted active:scale-[0.98]"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => profileData && setProfileOpen((v) => !v)}
                className={cn(
                  'hidden items-center gap-2 rounded-lg border bg-panel px-3 py-2 transition sm:flex',
                  profileOpen
                    ? 'border-accent-600 ring-1 ring-accent-600/30'
                    : 'border-topbar-border hover:border-slate-300 hover:bg-muted',
                  profileData ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent-100 text-xs font-semibold text-accent-700">
                  {getInitials(accountName)}
                </div>
                <div className="min-w-0 text-left">
                  <div className="truncate text-sm font-semibold text-topbar-foreground">{accountName}</div>
                  <div className="truncate text-xs text-topbar-muted">{accountMeta}</div>
                </div>
              </button>

              {profileData ? (
                <ProfilePanel
                  user={profileData}
                  onLogout={onLogout}
                  open={profileOpen}
                  onClose={closeProfile}
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-topbar-border bg-panel px-3 text-sm font-medium text-topbar-foreground transition hover:border-slate-300 hover:bg-muted active:scale-[0.98]"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mx-auto grid w-full min-h-[calc(100dvh-4rem)] grid-cols-1 lg:h-[calc(100dvh-4rem)] lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden',
          maxWidthClassName,
        )}
      >
        <aside className="border-b border-sidebar-border bg-sidebar px-4 py-4 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:border-r lg:border-b-0 lg:px-5">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-muted px-3.5 py-3.5">
            <div className="text-[0.68rem] font-semibold tracking-[0.12em] text-sidebar-muted-foreground uppercase">
              Console
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground">{sidebarTitle}</div>
            <div className="mt-1 text-sm text-sidebar-muted-foreground">{sidebarSubtitle}</div>
          </div>

          <nav className="mt-4 space-y-1.5 lg:flex-1" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition active:scale-[0.99]',
                    isActive
                      ? 'border-sidebar-accent-border bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'border-transparent text-sidebar-muted-foreground hover:border-sidebar-border hover:bg-sidebar-muted hover:text-sidebar-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'inline-flex size-7 items-center justify-center rounded-md border transition',
                        isActive
                          ? 'border-sidebar-accent-border bg-sidebar-accent-foreground/10 text-sidebar-accent-foreground'
                          : 'border-sidebar-border bg-sidebar text-sidebar-muted-foreground group-hover:text-sidebar-foreground',
                      )}
                    >
                      <item.icon className="size-4" />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 rounded-lg border border-sidebar-border bg-sidebar-muted px-3.5 py-3.5 lg:mt-auto">
            <div className="text-[0.68rem] font-semibold tracking-[0.12em] text-sidebar-muted-foreground uppercase">
              System status
            </div>
            <div className="mt-2.5 space-y-2">
              {statusItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-sidebar-muted-foreground">{item.label}</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-sidebar-foreground">
                    <Circle
                      className={cn(
                        'size-2.5 fill-current',
                        toneClassNames[item.tone ?? 'neutral'],
                      )}
                    />
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:h-full lg:overflow-y-auto lg:px-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
