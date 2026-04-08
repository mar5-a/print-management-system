import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '@/app/layouts/admin-shell'
import { TechShell } from '@/app/layouts/tech-shell'
import { UserShell } from '@/app/layouts/user-shell'
import { DashboardScreen } from '@/features/admin/dashboard/dashboard-screen'
import { GroupDetailScreen } from '@/features/admin/groups/group-detail-screen'
import { GroupsScreen } from '@/features/admin/groups/groups-screen'
import { PrinterDetailScreen } from '@/features/admin/printers/printer-detail-screen'
import { PrintersScreen } from '@/features/admin/printers/printers-screen'
import { QueueDetailScreen } from '@/features/admin/queues/queue-detail-screen'
import { QueuesScreen } from '@/features/admin/queues/queues-screen'
import {
  AboutScreen,
  AccountsScreen,
  DevicesScreen,
  LogsScreen,
  OptionsScreen,
  ReportsScreen,
} from '@/features/admin/system'
import { UserDetailScreen } from '@/features/admin/users/user-detail-screen'
import { UsersScreen } from '@/features/admin/users/users-screen'
import { TechAlertDetailScreen } from '@/features/technician/alerts/alert-detail-screen'
import { TechAlertsScreen } from '@/features/technician/alerts/alerts-screen'
import { TechDashboardScreen } from '@/features/technician/dashboard/dashboard-screen'
import { TechPrintersScreen } from '@/features/technician/printers/printers-screen'
import { TechUserDetailScreen } from '@/features/technician/users/user-detail-screen'
import { TechUsersScreen } from '@/features/technician/users/users-screen'
import { PortalDashboardScreen } from '@/features/portal/dashboard/dashboard-screen'
import { PortalHistoryScreen } from '@/features/portal/history/history-screen'
import { PortalSubmitJobScreen } from '@/features/portal/submit-job/submit-job-screen'
import { NotFoundPage } from '@/pages/not-found-page'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
      <Route path="/portal" element={<UserShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PortalDashboardScreen />} />
        <Route path="submit-job" element={<PortalSubmitJobScreen />} />
        <Route path="history" element={<PortalHistoryScreen />} />
      </Route>
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="users" element={<UsersScreen />} />
        <Route path="users/:userId" element={<UserDetailScreen />} />
        <Route path="groups" element={<GroupsScreen />} />
        <Route path="groups/:groupId" element={<GroupDetailScreen />} />
        <Route path="accounts" element={<AccountsScreen />} />
        <Route path="printers" element={<PrintersScreen />} />
        <Route path="printers/:printerId" element={<PrinterDetailScreen />} />
        <Route path="queues" element={<QueuesScreen />} />
        <Route path="queues/:queueId" element={<QueueDetailScreen />} />
        <Route path="devices" element={<DevicesScreen />} />
        <Route path="reports" element={<ReportsScreen />} />
        <Route path="options" element={<OptionsScreen />} />
        <Route path="logs" element={<LogsScreen />} />
        <Route path="about" element={<AboutScreen />} />
      </Route>
      <Route path="/tech" element={<TechShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TechDashboardScreen />} />
        <Route path="users" element={<TechUsersScreen />} />
        <Route path="users/:userId" element={<TechUserDetailScreen />} />
        <Route path="printers" element={<TechPrintersScreen />} />
        <Route path="alerts" element={<TechAlertsScreen />} />
        <Route path="alerts/:alertId" element={<TechAlertDetailScreen />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
