import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVisibleNavItems } from '../../utils/permissions';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/bookings': 'Bookings',
  '/bookings/new': 'New Booking',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/accounts': 'Accounts',
  '/transfers': 'Transfers',
  '/expenses': 'Expenses',
  '/payments/customers': 'Customer Payments',
  '/payments/suppliers': 'Supplier Payments',
  '/expenses': 'Expenses',
  '/reminders': 'Reminders',
  '/reports': 'Reports',
  '/cms': 'CMS',
  '/backup': 'Backup',
  '/security': 'Security',
  '/users': 'Users',
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
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
