import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVisibleNavGroups, isReadOnlyUser } from '../../utils/permissions';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/bookings': 'Booking Ledger',
  '/bookings/partial-payments': 'Partial Payments',
  '/bookings/voids': 'Voids',
  '/bookings/refunds': 'Refunds',
  '/bookings/reissues': 'Reissues',
  '/bookings/invoices': 'Invoices',
  '/bookings/hotel': 'Hotel Booking',
  '/bookings/esim': 'e-Sim',
  '/bookings/insurance': 'Insurance',
  '/reports/sales': 'Sales & RRV Report',
  '/reports/business-summary': 'Business Summary',
  '/finance/ledger': 'Ledger',
  '/bookings/new': 'New Booking',
  '/bookings/bulk-import': 'Bulk Import',
  '/bookings/upcoming': 'Upcoming Flights',
  '/agents': 'B2B Agents',
  '/agent-bookings': 'Agent Bookings',
  '/agent-accounting': 'Agent Accounting',
  '/settings/currency': 'Currency Settings',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/accounts': 'Accounts',
  '/transfers': 'Transfers',
  '/expenses': 'Expenses',
  '/payments/instant': 'Instant Payment',
  '/payments/requests': 'Payment Requests',
  '/payments/customers': 'Receipts',
  '/payments/history': 'Payment History',
  '/payments/gateway/result': 'Payment Result',
  '/payments/suppliers': 'Supplier Payments',
  '/reminders': 'Reminders',
  '/reports': 'Reports',
  '/cms': 'Frontend CMS',
  '/backup': 'Database Backup',
  '/security': 'Security & Audit',
  '/settings/payment': 'Payment Settings',
  '/settings/payment/banks': 'Bank List',
  '/settings/payment/mfs': 'MFS List',
  '/settings/payment/gateway': 'Online Gateway',
  '/settings/payment-accounts': 'Payment Accounts',
  '/settings/notifications': 'Notifications',
  '/settings/sms': 'SMS Settings',
  '/settings/email': 'Email Settings',
  '/settings/whatsapp': 'WhatsApp Settings',
  '/settings/notification-templates': 'Notification Templates',
  '/notifications/logs': 'Notification Logs',
  '/users': 'Users',
  '/roles': 'Roles & Permissions',
};

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = getVisibleNavGroups(user);
  const title = PAGE_TITLES[location.pathname] || 'Admin';

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar groups={navGroups} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:pl-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        {isReadOnlyUser(user) && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 lg:px-6">
            Demo mode — you can browse the panel but cannot create, edit, or delete records.
          </div>
        )}
        <main className="admin-content flex-1 overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
