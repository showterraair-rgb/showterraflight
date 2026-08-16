import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVisibleNavGroups, isReadOnlyUser } from '../../utils/permissions';
import { BPCtx, useBreakpointState } from '../../hooks/useBreakpoint';
import Sidebar, { DesktopSidebar } from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { C } from '../../theme/tokens';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview & KPIs' },
  '/bookings': { title: 'Booking Ledger', sub: 'All bookings — dual-currency R$ / ৳' },
  '/bookings/partial-payments': { title: 'Partial Payments', sub: 'Bookings with outstanding balances' },
  '/bookings/voids': { title: 'Voids', sub: 'Voided tickets' },
  '/bookings/refunds': { title: 'Refunds', sub: 'Processed refunds' },
  '/bookings/pending-refunds': { title: 'Pending Refunds', sub: 'Awaiting approval' },
  '/bookings/reissues': { title: 'Reissues', sub: 'Ticket reissue operations' },
  '/bookings/invoices': { title: 'Invoices', sub: 'Generated invoices' },
  '/bookings/hotel': { title: 'Hotel Booking', sub: '' },
  '/bookings/esim': { title: 'e-Sim', sub: '' },
  '/bookings/insurance': { title: 'Insurance', sub: '' },
  '/reports/sales': { title: 'Sales & RRV Report', sub: 'Revenue recognition & validation' },
  '/reports/business-summary': { title: 'Business Summary', sub: 'High-level revenue report' },
  '/finance/ledger': { title: 'Ledger', sub: 'Full accounting ledger' },
  '/bookings/new': { title: 'New Booking', sub: 'Create a flight booking' },
  '/bookings/bulk-import': { title: 'Bulk Import', sub: '' },
  '/bookings/upcoming': { title: 'Upcoming Flights', sub: '' },
  '/agents': { title: 'B2B Agents', sub: 'Sub-agent network' },
  '/agent-bookings': { title: 'Agent Bookings', sub: 'Bookings by agent' },
  '/agent-accounting': { title: 'Agent Accounting', sub: 'Agent receivables & payables' },
  '/settings/currency': { title: 'Currency', sub: 'Exchange rates & pairs' },
  '/customers': { title: 'Customers', sub: 'Passenger & corporate accounts' },
  '/suppliers': { title: 'Suppliers', sub: 'Airlines, hotels, ancillaries' },
  '/accounts': { title: 'Accounts', sub: 'Chart of accounts' },
  '/transfers': { title: 'Transfers', sub: 'Internal fund transfers' },
  '/expenses': { title: 'Expenses', sub: 'Expense tracking' },
  '/payments/instant': { title: 'Instant Payment', sub: 'PIX / bKash real-time transfer' },
  '/payments/requests': { title: 'Payment Requests', sub: 'Send a payment request' },
  '/payments/customers': { title: 'Record Receipt', sub: 'Log an incoming payment' },
  '/payments/history': { title: 'Payment History', sub: 'All recorded receipts' },
  '/payments/gateway/result': { title: 'Payment Result', sub: '' },
  '/payments/suppliers': { title: 'Supplier Payments', sub: 'Airline & GDS settlement' },
  '/reminders': { title: 'Reminders', sub: 'Scheduled reminders' },
  '/reports': { title: 'All Reports', sub: 'Report index' },
  '/cms': { title: 'Frontend CMS', sub: 'Customer-facing content' },
  '/livestream': { title: 'Live Stream', sub: 'Schedule, go live & publish' },
  '/backup': { title: 'Database Backup', sub: 'Backup schedule & restore' },
  '/security': { title: 'Security & Audit', sub: 'Security configuration' },
  '/settings/payment': { title: 'Payment Settings', sub: 'Gateway configuration' },
  '/settings/payment/banks': { title: 'Bank List', sub: '' },
  '/settings/payment/mfs': { title: 'MFS List', sub: '' },
  '/settings/payment/gateway': { title: 'Online Gateway', sub: '' },
  '/settings/payment-accounts': { title: 'Payment Accounts', sub: 'Bank & gateway accounts' },
  '/settings/notifications': { title: 'Notification Hub', sub: 'Rules & routing' },
  '/settings/sms': { title: 'SMS', sub: 'SMS settings' },
  '/settings/email': { title: 'Email', sub: 'Email settings' },
  '/settings/whatsapp': { title: 'WhatsApp', sub: 'WhatsApp settings' },
  '/settings/notification-templates': { title: 'Templates', sub: 'Message templates' },
  '/notifications/logs': { title: 'Notification Logs', sub: 'Delivery status log' },
  '/users': { title: 'Users', sub: 'Admin user management' },
  '/roles': { title: 'Roles & Permissions', sub: 'Access control matrix' },
};

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const bp = useBreakpointState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navGroups = getVisibleNavGroups(user);
  const meta = PAGE_META[location.pathname] || { title: 'Admin', sub: '' };
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  const toggleSidebar = () => {
    if (isMobile || isTablet) setDrawerOpen((v) => !v);
    else setSidebarCollapsed((v) => !v);
  };

  return (
    <BPCtx.Provider value={bp}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: C.bg,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Desktop: always-visible sidebar */}
        {!isMobile && !isTablet && (
          <DesktopSidebar
            groups={navGroups}
            collapsed={sidebarCollapsed}
            onClose={() => {}}
          />
        )}

        {/* Tablet: icon rail; expand overlays content when open */}
        {isTablet && (
          <>
            {drawerOpen && (
              <div
                onClick={() => setDrawerOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(20,33,61,0.35)', zIndex: 40 }}
              />
            )}
            <div style={{ position: 'relative', zIndex: drawerOpen ? 50 : 10, flexShrink: 0 }}>
              <DesktopSidebar
                groups={navGroups}
                collapsed={!drawerOpen}
                onClose={() => setDrawerOpen(false)}
              />
            </div>
          </>
        )}

        {/* Mobile: overlay drawer */}
        {isMobile && (
          <Sidebar
            groups={navGroups}
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            mode="fixed"
          />
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            marginLeft: isTablet ? (drawerOpen ? 0 : 0) : 0,
          }}
        >
          <Header
            title={meta.title}
            subtitle={meta.sub}
            onMenuClick={toggleSidebar}
          />
          {isReadOnlyUser(user) && (
            <div
              className="border-b px-4 py-2 text-center text-sm"
              style={{
                borderColor: C.amberLight,
                background: C.amberLight,
                color: '#92400e',
              }}
            >
              Demo mode — you can browse the panel but cannot create, edit, or delete records.
            </div>
          )}
          <main
            className="admin-content"
            style={{
              flex: 1,
              overflowX: 'hidden',
              padding: isMobile ? '14px 12px 80px' : '22px 22px 48px',
              background: C.bg,
            }}
          >
            <Outlet />
          </main>
        </div>

        {isMobile && <BottomNav groups={navGroups} />}
      </div>
    </BPCtx.Provider>
  );
}
