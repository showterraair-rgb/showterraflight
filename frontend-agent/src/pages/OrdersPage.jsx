import BookingsPage from './BookingsPage';

/** Order history uses the same booking list with print-friendly wrapper */
export default function OrdersPage() {
  return (
    <div className="print:p-0">
      <BookingsPage />
    </div>
  );
}
