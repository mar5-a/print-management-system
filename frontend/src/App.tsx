import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/layout/admin-shell'
import { DashboardPage } from './pages/dashboard-page'
import { GroupDetailPage, GroupsPage } from './pages/groups-page'
import { NotFoundPage } from './pages/not-found-page'
import { PrinterDetailPage, PrintersPage } from './pages/printers-page'
import {
  AboutPage,
  AccountsPage,
  DevicesPage,
  LogsPage,
  OptionsPage,
  ReportsPage,
} from './pages/system-pages'
import { UserDetailPage, UsersPage } from './pages/users-page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserDetailPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:groupId" element={<GroupDetailPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="printers" element={<PrintersPage />} />
        <Route path="printers/:printerId" element={<PrinterDetailPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="options" element={<OptionsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
