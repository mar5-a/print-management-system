import { useState } from 'react'
import { Printer, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'
import { api } from '@/lib/api'
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
  department_name: string | null
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
    department: user.department_name ?? 'General Access',
    quotaUsed: user.quota_used,
    quotaTotal: user.quota_total,
  }
}

export function SignInPage() {
  const navigate = useNavigate()
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
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
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
    <div className="min-h-screen bg-transparent text-ink-950">
      <div className="h-9 border-b border-accent-600/20 bg-accent-700 text-[0.78rem] text-white">
        <div className="mx-auto flex h-full w-full max-w-[1040px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 font-medium">
            <Printer className="size-3.5" />
            <span>Print Management System</span>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/80 sm:flex">
            <span>University Access</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-2.25rem)] w-full max-w-[1040px] items-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden border border-line/90 bg-white shadow-[0_18px_45px_-30px_rgba(8,17,29,0.35)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="hidden border-r border-line/80 bg-[#111827] px-8 py-10 text-white lg:flex lg:flex-col">
            <div className="flex items-center gap-2 text-accent-500">
              <ShieldCheck className="size-4" />
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em]">Secure Access</span>
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in to continue</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Access your dashboard with role-based permissions for administrator, technician,
              student, and faculty views.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-8">
              <div className="ui-kicker">University Portal</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Sign In</h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter your account credentials to access the print management system.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-950">
                  Email or Username
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
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink-950">
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
                <div className="border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 space-y-2 border border-line/70 bg-mist-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-ink-950">Test Credentials (all use password: 123456)</p>
              <ul className="space-y-1 font-mono text-slate-600">
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
