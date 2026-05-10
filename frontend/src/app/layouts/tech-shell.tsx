import { Bell, LayoutDashboard, Printer, Wrench } from 'lucide-react'
import { useNavigate, useOutlet } from 'react-router-dom'
import { AppShell, type AppShellNavItem } from '@/components/ui/app-shell'
import type { ProfilePanelUserData } from '@/components/ui/profile-panel'
import { getCurrentUser, logout } from '@/lib/auth'

const navItems: AppShellNavItem[] = [
  { label: 'Dashboard', href: '/tech/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/tech/users', icon: Wrench },
  { label: 'Printers', href: '/tech/printers', icon: Printer },
  { label: 'Alerts', href: '/tech/alerts', icon: Bell },
]

export function TechShell() {
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
    displayName: user?.displayName ?? user?.username ?? 'Technician',
    username: user?.username ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'Technician',
    department: user?.department,
  }

  return (
    <AppShell
      appTitle="Print Management System"
      appSubtitle="Technician"
      sidebarTitle="CCM Technician"
      sidebarSubtitle="User access and printer support"
      navItems={navItems}
      statusItems={[
        { label: 'Auth', value: 'DB-backed', tone: 'info' },
        { label: 'Session', value: 'Local', tone: 'neutral' },
      ]}
      accountName={user?.displayName ?? user?.username ?? 'Technician'}
      accountMeta={user?.role ?? 'Technician'}
      onLogout={handleLogout}
      profileData={profileData}
    >
      {outlet}
    </AppShell>
  )
}
