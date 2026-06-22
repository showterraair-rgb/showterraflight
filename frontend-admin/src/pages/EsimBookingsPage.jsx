import { BookingsListView } from './BookingsPage';

export default function EsimBookingsPage() {
  return (
    <BookingsListView
      productCategory="esim"
      title="e-Sim"
      description="e-Sim sales and activations."
      newBookingPath="/bookings/new?category=esim"
    />
  );
}
