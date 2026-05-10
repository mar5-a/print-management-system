import { useState } from 'react'
import { Moon, Printer, ShieldCheck, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import type { AuthUser, UserRole } from '@/types/auth'

interface SignInFormData {
  email: string
  password: string
}

interface BackendAuthUser {
  id: string
  username: string
  email: string
  display_name: string
  role: 'admin' | 'technician' | 'standard_user'
  is_suspended: boolean
  quota_used: number
  quota_total: number
}

interface LoginResponse {
  data: {
    token: string
    user: BackendAuthUser
  }
}

function mapRole(role: BackendAuthUser['role']): UserRole {
  if (role === 'admin') return 'Administrator'
  if (role === 'technician') return 'Technician'
  return 'Student'
}

function mapAuthUser(user: BackendAuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: mapRole(user.role),
    status: user.is_suspended ? 'Suspended' : 'Active',
    displayName: user.display_name,
    quotaUsed: user.quota_used,
    quotaTotal: user.quota_total,
  }
}

export function SignInPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)

    try {
      const result = await api.post<LoginResponse>('/auth/login', {
        credential: formData.email,
        password: formData.password,
      })
      const authUser = mapAuthUser(result.data.user)

      login(authUser, result.data.token)

      switch (authUser.role) {
        case 'Administrator':
          navigate('/admin/dashboard')
          break
        case 'Technician':
          navigate('/tech/dashboard')
          break
        case 'Student':
        case 'Faculty':
          navigate('/portal/dashboard')
          break
        default:
          setError('Unable to determine user role')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-topbar-border bg-topbar/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-topbar-border bg-panel text-topbar-foreground">
              <Printer className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight text-topbar-foreground">Print Management System</div>
              <div className="text-xs text-topbar-muted">University access</div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-topbar-border bg-panel text-topbar-foreground transition hover:border-slate-300 hover:bg-muted active:scale-[0.98]"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1040px] items-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-xl border border-line/90 bg-panel shadow-[0_20px_45px_-30px_rgba(2,12,27,0.45)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="hidden border-r border-line/80 bg-sidebar px-8 py-10 text-sidebar-foreground lg:flex lg:flex-col">
            <div className="flex items-center gap-2 text-accent-500">
              <ShieldCheck className="size-4" />
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em]">Secure access</span>
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in to continue</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-sidebar-muted-foreground">
              Access role-based workflows for administrator, technician, student, and faculty
              printing operations.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-8">
              <div className="ui-kicker">University portal</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Sign in</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your account credentials to access the print management system.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email or username
                </label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-danger-500/35 bg-danger-100 px-4 py-3 text-sm text-danger-500">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-line bg-muted px-4 py-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Test credentials (all use password: 123456)</p>
              <ul className="mt-2 space-y-1 font-mono">
                <li>admin@university.edu - Administrator</li>
                <li>tech@university.edu - Technician</li>
                <li>student@university.edu - Student</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
