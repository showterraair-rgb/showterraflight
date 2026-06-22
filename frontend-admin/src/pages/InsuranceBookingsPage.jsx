import { BookingsListView } from './BookingsPage';

export default function InsuranceBookingsPage() {
  return (
    <BookingsListView
      productCategory="insurance"
      title="Insurance"
      description="Travel insurance policies and sales."
      newBookingPath="/bookings/new?category=insurance"
    />
  );
}
