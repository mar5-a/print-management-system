import { FileClock, LayoutDashboard, Upload } from 'lucide-react'
import { useNavigate, useOutlet } from 'react-router-dom'
import { AppShell, type AppShellNavItem } from '@/components/ui/app-shell'
import type { ProfilePanelUserData } from '@/components/ui/profile-panel'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'
import { logout } from '@/lib/auth'

const navItems: AppShellNavItem[] = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Submit Job', href: '/portal/submit-job', icon: Upload },
  { label: 'History', href: '/portal/history', icon: FileClock },
]

export function UserShell() {
  const navigate = useNavigate()
  const outlet = useOutlet()
  const profile = getCurrentPortalUserProfile()

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) {
      return
    }

    logout()
    navigate('/sign-in', { replace: true })
  }

  const quotaPercent =
    profile.quotaTotal > 0 ? Math.min(100, Math.round((profile.quotaUsed / profile.quotaTotal) * 100)) : 0

  const profileData: ProfilePanelUserData = {
    displayName: profile.displayName,
    username: profile.username,
    email: '',
    role: profile.role,
    department: profile.department,
    quotaUsed: profile.quotaUsed,
    quotaTotal: profile.quotaTotal,
  }

  return (
    <AppShell
      appTitle="Print Management System"
      appSubtitle="Portal"
      sidebarTitle="Print Portal"
      sidebarSubtitle="Submit, hold, and release jobs"
      navItems={navItems}
      statusItems={[
        { label: 'Quota used', value: `${profile.quotaUsed}/${profile.quotaTotal}`, tone: quotaPercent > 85 ? 'warn' : 'info' },
        { label: 'Session', value: 'Local', tone: 'neutral' },
      ]}
      accountName={profile.displayName}
      accountMeta={`${profile.role} · ${profile.department}`}
      onLogout={handleLogout}
      maxWidthClassName="max-w-[1640px]"
      profileData={profileData}
    >
      {outlet}
    </AppShell>
  )
}
