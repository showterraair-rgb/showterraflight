import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CustomersPage from '../pages/CustomersPage';
import { CustomerAccountPage } from '../pages/PartyAccountPage';
import SuppliersPage from '../pages/SuppliersPage';
import { SupplierAccountPage } from '../pages/PartyAccountPage';
import BookingsPage from '../pages/BookingsPage';
import BookingFormPage from '../pages/BookingFormPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import ExpensesPage from '../pages/ExpensesPage';
import TransfersPage from '../pages/TransfersPage';
import AccountsPage from '../pages/AccountsPage';
import AccountStatementPage from '../pages/AccountStatementPage';
import CustomerPaymentsPage from '../pages/CustomerPaymentsPage';
import PaymentHistoryPage from '../pages/PaymentHistoryPage';
import InstantPaymentPage from '../pages/InstantPaymentPage';
import PaymentRequestsPage from '../pages/PaymentRequestsPage';
import SupplierPaymentsPage from '../pages/SupplierPaymentsPage';
import RemindersPage from '../pages/RemindersPage';
import ReportsPage from '../pages/ReportsPage';
import CmsPage from '../pages/CmsPage';
import BackupPage from '../pages/BackupPage';
import SecurityPage from '../pages/SecurityPage';
import PaymentAccountsPage from '../pages/PaymentAccountsPage';
import HotelBookingsPage from '../pages/HotelBookingsPage';
import EsimBookingsPage from '../pages/EsimBookingsPage';
import InsuranceBookingsPage from '../pages/InsuranceBookingsPage';
import PaymentSettingsHubPage from '../pages/PaymentSettingsHubPage';
import GatewaySettingsPage from '../pages/GatewaySettingsPage';
import GatewayResultPage from '../pages/GatewayResultPage';
import BankListPage from '../pages/BankListPage';
import MfsListPage from '../pages/MfsListPage';
import SmsSettingsPage from '../pages/SmsSettingsPage';
import EmailSettingsPage from '../pages/EmailSettingsPage';
import WhatsAppSettingsPage from '../pages/WhatsAppSettingsPage';
import NotificationsHubPage from '../pages/NotificationsHubPage';
import NotificationTemplatesPage from '../pages/NotificationTemplatesPage';
import NotificationLogsPage from '../pages/NotificationLogsPage';
import UsersPage from '../pages/UsersPage';
import PartialPaymentsPage from '../pages/PartialPaymentsPage';
import SalesReportPage from '../pages/SalesReportPage';
import RolesPermissionsPage from '../pages/RolesPermissionsPage';
import AgentsPage from '../pages/AgentsPage';
import AgentDetailPage from '../pages/AgentDetailPage';
import AgentBookingsPage from '../pages/AgentBookingsPage';
import AgentBookingDetailPage from '../pages/AgentBookingDetailPage';
import AgentAccountingPage from '../pages/AgentAccountingPage';
import CurrencySettingsPage from '../pages/CurrencySettingsPage';
import UpcomingFlightsPage from '../pages/UpcomingFlightsPage';
import { VoidBookingsPage, RefundBookingsPage, ReissueBookingsPage, InvoicesPage } from '../pages/TicketingListPages';
import LedgerPage from '../pages/LedgerPage';
import BusinessSummaryPage from '../pages/BusinessSummaryPage';
import BulkImportPage from '../pages/BulkImportPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute permissions={['dashboard:view']}><DashboardPage /></ProtectedRoute>} />

            <Route path="customers" element={<ProtectedRoute permissions={['customers:view']}><CustomersPage /></ProtectedRoute>} />
            <Route path="customers/:id/account" element={<ProtectedRoute permissions={['customers:view']}><CustomerAccountPage /></ProtectedRoute>} />
            <Route path="suppliers" element={<ProtectedRoute permissions={['suppliers:view']}><SuppliersPage /></ProtectedRoute>} />
            <Route path="suppliers/:id/account" element={<ProtectedRoute permissions={['suppliers:view']}><SupplierAccountPage /></ProtectedRoute>} />
            <Route path="orders" element={<Navigate to="/bookings" replace />} />

            <Route path="bookings" element={<ProtectedRoute permissions={['bookings:view']}><BookingsPage /></ProtectedRoute>} />
            <Route path="bookings/hotel" element={<ProtectedRoute permissions={['bookings:view']}><HotelBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/esim" element={<ProtectedRoute permissions={['bookings:view']}><EsimBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/insurance" element={<ProtectedRoute permissions={['bookings:view']}><InsuranceBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/partial-payments" element={<ProtectedRoute permissions={['bookings:view']}><PartialPaymentsPage /></ProtectedRoute>} />
            <Route path="bookings/new" element={<ProtectedRoute permissions={['bookings:create']}><BookingFormPage /></ProtectedRoute>} />
            <Route path="bookings/bulk-import" element={<ProtectedRoute permissions={['bookings:create']}><BulkImportPage /></ProtectedRoute>} />
            <Route path="bookings/upcoming" element={<ProtectedRoute permissions={['bookings:view']}><UpcomingFlightsPage /></ProtectedRoute>} />
            <Route path="bookings/voids" element={<ProtectedRoute permissions={['bookings:view']}><VoidBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/refunds" element={<ProtectedRoute permissions={['bookings:view']}><RefundBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/reissues" element={<ProtectedRoute permissions={['bookings:view']}><ReissueBookingsPage /></ProtectedRoute>} />
            <Route path="bookings/invoices" element={<ProtectedRoute permissions={['bookings:view']}><InvoicesPage /></ProtectedRoute>} />
            <Route path="bookings/:id/edit" element={<ProtectedRoute permissions={['bookings:update']}><BookingFormPage /></ProtectedRoute>} />
            <Route path="bookings/:id" element={<ProtectedRoute permissions={['bookings:view']}><BookingDetailPage /></ProtectedRoute>} />

            <Route path="accounts" element={<ProtectedRoute permissions={['accounts:view']}><AccountsPage /></ProtectedRoute>} />
            <Route path="accounts/:id/statement" element={<ProtectedRoute permissions={['accounts:view']}><AccountStatementPage /></ProtectedRoute>} />
            <Route path="payments/instant" element={<ProtectedRoute permissions={['payments:customer']}><InstantPaymentPage /></ProtectedRoute>} />
            <Route path="payments/requests" element={<ProtectedRoute permissions={['payments:customer']}><PaymentRequestsPage /></ProtectedRoute>} />
            <Route path="payments/customers" element={<ProtectedRoute permissions={['payments:customer']}><CustomerPaymentsPage /></ProtectedRoute>} />
            <Route path="payments/history" element={<ProtectedRoute permissions={['payments:customer']}><PaymentHistoryPage /></ProtectedRoute>} />
            <Route path="payments/gateway/result" element={<ProtectedRoute permissions={['payments:customer']}><GatewayResultPage /></ProtectedRoute>} />
            <Route path="payments/suppliers" element={<ProtectedRoute permissions={['payments:supplier']}><SupplierPaymentsPage /></ProtectedRoute>} />
            <Route path="finance/ledger" element={<ProtectedRoute permissions={['accounts:view']}><LedgerPage /></ProtectedRoute>} />
            <Route path="expenses" element={<ProtectedRoute permissions={['expenses:view']}><ExpensesPage /></ProtectedRoute>} />
            <Route path="transfers" element={<ProtectedRoute permissions={['transfers:create', 'accounts:view']}><TransfersPage /></ProtectedRoute>} />
            <Route path="reminders" element={<ProtectedRoute permissions={['reminders:view']}><RemindersPage /></ProtectedRoute>} />
            <Route path="reports/business-summary" element={<ProtectedRoute permissions={['reports:view', 'dashboard:view']}><BusinessSummaryPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute permissions={['reports:view']}><ReportsPage /></ProtectedRoute>} />
            <Route path="reports/sales" element={<ProtectedRoute permissions={['reports:view']}><SalesReportPage /></ProtectedRoute>} />
            <Route path="cms" element={<ProtectedRoute permissions={['cms:view']}><CmsPage /></ProtectedRoute>} />
            <Route path="backup" element={<ProtectedRoute permissions={['backup:manage']}><BackupPage /></ProtectedRoute>} />
            <Route path="security" element={<ProtectedRoute permissions={['audit:view']}><SecurityPage /></ProtectedRoute>} />
            <Route path="settings/payment" element={<ProtectedRoute permissions={['accounts:view', 'settings:manage', 'notifications:view']}><PaymentSettingsHubPage /></ProtectedRoute>} />
            <Route path="settings/payment/banks" element={<ProtectedRoute permissions={['accounts:view', 'settings:manage', 'notifications:view']}><BankListPage /></ProtectedRoute>} />
            <Route path="settings/payment/mfs" element={<ProtectedRoute permissions={['accounts:view', 'settings:manage', 'notifications:view']}><MfsListPage /></ProtectedRoute>} />
            <Route path="settings/payment/gateway" element={<ProtectedRoute permissions={['accounts:view', 'settings:manage', 'notifications:view']}><GatewaySettingsPage /></ProtectedRoute>} />
            <Route path="settings/payment-accounts" element={<ProtectedRoute permissions={['accounts:view', 'settings:manage', 'notifications:view']}><PaymentAccountsPage /></ProtectedRoute>} />
            <Route path="settings/notifications" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><NotificationsHubPage /></ProtectedRoute>} />
            <Route path="settings/sms" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><SmsSettingsPage /></ProtectedRoute>} />
            <Route path="settings/email" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><EmailSettingsPage /></ProtectedRoute>} />
            <Route path="settings/whatsapp" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><WhatsAppSettingsPage /></ProtectedRoute>} />
            <Route path="settings/notification-templates" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><NotificationTemplatesPage /></ProtectedRoute>} />
            <Route path="notifications/logs" element={<ProtectedRoute permissions={['notifications:view', 'notifications:manage', 'settings:manage']}><NotificationLogsPage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute permissions={['users:view']}><UsersPage /></ProtectedRoute>} />
            <Route path="roles" element={<ProtectedRoute permissions={['roles:manage']}><RolesPermissionsPage /></ProtectedRoute>} />

            <Route path="agents" element={<ProtectedRoute permissions={['agents:view']}><AgentsPage /></ProtectedRoute>} />
            <Route path="agents/:id" element={<ProtectedRoute permissions={['agents:view']}><AgentDetailPage /></ProtectedRoute>} />
            <Route path="agents/:id/bookings" element={<ProtectedRoute permissions={['agents:view']}><AgentBookingsPage agentScoped /></ProtectedRoute>} />
            <Route path="agent-bookings" element={<ProtectedRoute permissions={['agent-bookings:view']}><AgentBookingsPage /></ProtectedRoute>} />
            <Route path="agent-bookings/:id" element={<ProtectedRoute permissions={['agent-bookings:view']}><AgentBookingDetailPage /></ProtectedRoute>} />
            <Route path="agent-accounting" element={<ProtectedRoute permissions={['agent-accounting:view']}><AgentAccountingPage /></ProtectedRoute>} />
            <Route path="settings/currency" element={<ProtectedRoute permissions={['settings:manage', 'cms:manage']}><CurrencySettingsPage /></ProtectedRoute>} />
            <Route path="agent-accounting/:agentId" element={<ProtectedRoute permissions={['agent-accounting:view']}><AgentAccountingPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
