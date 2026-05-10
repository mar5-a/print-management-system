import {
  BookOpen,
  GitBranch,
  LayoutDashboard,
  LayoutList,
  Logs,
  Printer,
  Users,
} from 'lucide-react'
import { useNavigate, useOutlet } from 'react-router-dom'
import { AppShell, type AppShellNavItem } from '@/components/ui/app-shell'
import type { ProfilePanelUserData } from '@/components/ui/profile-panel'
import { getCurrentUser, logout } from '@/lib/auth'

const navItems: AppShellNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Groups', href: '/admin/groups', icon: LayoutList },
  { label: 'Printers', href: '/admin/printers', icon: Printer },
  { label: 'Queues', href: '/admin/queues', icon: GitBranch },
  { label: 'Logs', href: '/admin/logs', icon: Logs },
  { label: 'About', href: '/admin/about', icon: BookOpen },
]

export function AdminShell() {
  const navigate = useNavigate()
  const outlet = useOutlet()
  const user = getCurrentUser()

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) {
      return
    }

    logout()
    navigate('/sign-in', { replace: true })
  }

  const profileData: ProfilePanelUserData = {
    displayName: user?.displayName ?? user?.username ?? 'Administrator',
    username: user?.username ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'Administrator',
    department: user?.department,
  }

  return (
    <AppShell
      appTitle="Print Management System"
      appSubtitle="Administrator"
      sidebarTitle="CCM Admin"
      sidebarSubtitle="Operations and policy control"
      navItems={navItems}
      statusItems={[
        { label: 'Auth', value: 'DB-backed', tone: 'info' },
        { label: 'Session', value: 'Local', tone: 'neutral' },
      ]}
      accountName={user?.displayName ?? user?.username ?? 'Administrator'}
      accountMeta={user?.role ?? 'Administrator'}
      onLogout={handleLogout}
      profileData={profileData}
    >
      {outlet}
    </AppShell>
  )
}
