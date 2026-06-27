import { BookingsListView } from './BookingsPage';

export function VoidBookingsPage() {
  return (
    <BookingsListView
      productCategory="air"
      title="Voids"
      description="Bookings voided before ticket issue — search by PNR, booking number, or customer."
      fixedStatus="voided"
      hideStatusTabs
      showRrvColumns
      hideNewButton
    />
  );
}

export function RefundBookingsPage() {
  return (
    <BookingsListView
      productCategory="air"
      title="Refunds"
      description="Refunded tickets with penalty and refund amounts."
      fixedStatus="refunded"
      hideStatusTabs
      showRrvColumns
      hideNewButton
    />
  );
}

export function ReissueBookingsPage() {
  return (
    <BookingsListView
      productCategory="air"
      title="Reissues"
      description="Tickets reissued to new bookings — open detail to view the replacement."
      fixedStatus="reissued"
      hideStatusTabs
      showRrvColumns
      hideNewButton
    />
  );
}

export function InvoicesPage() {
  return (
    <BookingsListView
      productCategory="air"
      title="Invoices"
      description="Ticketed bookings with invoice PDF download — search by booking number or customer."
      invoicedOnly
      hideStatusTabs
      invoiceFocus
    />
  );
}
