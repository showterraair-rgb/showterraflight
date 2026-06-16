import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { agentApi } from '../services/agent.api';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bookings/new', label: 'New Booking' },
  { to: '/bookings', label: 'My Bookings' },
  { to: '/orders', label: 'Order History' },
  { to: '/reports', label: 'Reports' },
  { to: '/statement', label: 'Statement' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

export default function AgentLayout() {
  const navigate = useNavigate();
  const { agent, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    agentApi.notifications({ limit: 1 }).then(({ data }) => setUnread(data.unreadCount || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Show Terra Flight</p>
          <p className="font-semibold text-slate-900">Agent Portal</p>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
              {item.to === '/notifications' && unread > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <button type="button" className="md:hidden btn-secondary" onClick={() => setSidebarOpen((v) => !v)}>Menu</button>
          <div className="text-right md:ml-auto">
            <p className="text-sm font-semibold text-slate-900">{agent?.companyName}</p>
            <p className="text-xs text-slate-500">{agent?.agentId} · {agent?.contactPerson}</p>
          </div>
          <button type="button" onClick={handleLogout} className="ml-4 btn-secondary">Logout</button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
