import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVisibleNavItems, isReadOnlyUser } from '../../utils/permissions';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/bookings': 'Bookings',
  '/bookings/new': 'New Booking',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/accounts': 'Accounts',
  '/transfers': 'Transfers',
  '/expenses': 'Expenses',
  '/payments/customers': 'Customer Payments',
  '/payments/suppliers': 'Supplier Payments',
  '/reminders': 'Reminders',
  '/reports': 'Reports',
  '/cms': 'CMS',
  '/backup': 'Backup',
  '/security': 'Security',
  '/settings/payment-accounts': 'Payment Accounts',
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

  const navItems = getVisibleNavItems(user);
  const title = PAGE_TITLES[location.pathname] || 'Admin';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:pl-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        {isReadOnlyUser(user) && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 lg:px-6">
            Demo mode — you can browse the panel but cannot create, edit, or delete records.
          </div>
        )}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
