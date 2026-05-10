import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Printer,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useTheme, type ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface ProfilePanelUserData {
  displayName: string
  username: string
  email: string
  role: string
  department?: string
  quotaUsed?: number
  quotaTotal?: number
}

const COPY_COUNT_KEY = 'pms-default-copies'
const NOTIFICATIONS_KEY = 'pms-notifications'

function readDefaultCopies(): number {
  const stored = localStorage.getItem(COPY_COUNT_KEY)
  const parsed = stored ? Number(stored) : NaN
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 99 ? parsed : 1
}

function writeDefaultCopies(value: number) {
  localStorage.setItem(COPY_COUNT_KEY, String(value))
}

function readNotifications(): boolean {
  return localStorage.getItem(NOTIFICATIONS_KEY) !== 'false'
}

function writeNotifications(value: boolean) {
  localStorage.setItem(NOTIFICATIONS_KEY, value ? 'true' : 'false')
}

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

interface ProfilePanelProps {
  user: ProfilePanelUserData
  onLogout: () => void
  open: boolean
  onClose: () => void
}

export function ProfilePanel({ user, onLogout, open, onClose }: ProfilePanelProps) {
  const { preference, setPreference } = useTheme()
  const [defaultCopies, setDefaultCopies] = useState(readDefaultCopies)
  const [notifications, setNotifications] = useState(readNotifications)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  const handleCopiesChange = (value: number) => {
    const clamped = Math.max(1, Math.min(99, value))
    setDefaultCopies(clamped)
    writeDefaultCopies(clamped)
  }

  const handleNotificationsToggle = () => {
    const next = !notifications
    setNotifications(next)
    writeNotifications(next)
  }

  const showQuota = user.quotaTotal !== undefined && user.quotaTotal !== undefined && user.quotaTotal > 0
  const quotaPercent = showQuota
    ? Math.min(100, Math.round(((user.quotaUsed ?? 0) / (user.quotaTotal ?? 1)) * 100))
    : 0
  const isStudent = user.role === 'Student'
  const isFaculty = user.role === 'Faculty'
  const isAdmin = user.role === 'Administrator'
  const isTech = user.role === 'Technician'
  const isPortalUser = isStudent || isFaculty

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute right-4 top-full z-50 mt-2 w-[380px] rounded-xl border border-border bg-panel shadow-xl',
        'animate-in fade-in slide-in-from-top-2 duration-200',
      )}
      role="dialog"
      aria-label="Profile & Settings"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-sm font-bold text-accent-700">
            {user.displayName
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? '')
              .join('') || 'U'}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{user.displayName}</div>
            <div className="text-xs text-muted-foreground">{user.role}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        <div className="space-y-5">
          <section>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <User className="size-3.5" />
              Profile
            </div>
            <div className="mt-3 space-y-2.5">
              <ProfileField label="Display Name" value={user.displayName} />
              <ProfileField label="Username" value={user.username} />
              {user.email ? <ProfileField label="Email" value={user.email} /> : null}
              <ProfileField label="Role" value={user.role} />
              {user.department ? <ProfileField label="Department" value={user.department} /> : null}
            </div>
            <p className="mt-2.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              Identity is managed by the system. Contact your administrator to update account details.
            </p>
          </section>

          {showQuota ? (
            <section>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Printer className="size-3.5" />
                Print Quota
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {user.quotaUsed} / {user.quotaTotal}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      quotaPercent > 85 ? 'text-amber-500' : 'text-muted-foreground',
                    )}
                  >
                    {quotaPercent}% used
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      quotaPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {isAdmin || isTech ? (
            <section>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Shield className="size-3.5" />
                Access
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auth mode</span>
                  <span className="font-medium text-foreground">DB-backed (local)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-medium text-foreground">Local JWT</span>
                </div>
                {isAdmin ? (
                  <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                    Full administrative access to users, printers, queues, groups, and system logs.
                  </p>
                ) : (
                  <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                    Technician access to printer status, user support, and alert management.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Sun className="size-3.5" />
              Appearance
            </div>
            <div className="mt-3 flex gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreference(opt.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition',
                    preference === opt.value
                      ? 'border-accent-600 bg-accent-100/50 text-accent-700'
                      : 'border-border bg-transparent text-muted-foreground hover:border-slate-300 hover:bg-muted',
                  )}
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {isPortalUser ? (
            <section>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Printer className="size-3.5" />
                Print Defaults
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Default copy count</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                      onClick={() => handleCopiesChange(defaultCopies - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={defaultCopies}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (Number.isFinite(val)) handleCopiesChange(val)
                      }}
                      className="h-8 w-14 rounded-md border border-border bg-transparent text-center text-sm font-medium text-foreground focus:border-accent-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                      onClick={() => handleCopiesChange(defaultCopies + 1)}
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground">Saved locally</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Only PDF uploads are supported</span>
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Monitor className="size-3.5" />
              Preferences
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In-app notifications</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications}
                  onClick={handleNotificationsToggle}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
                    notifications ? 'bg-accent-600' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                      notifications ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auth mode</span>
              <span className="font-medium text-foreground">Local DB session</span>
            </div>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              Active Directory integration is planned. Current authentication uses the local database.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                onLogout()
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 active:scale-[0.98] dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
