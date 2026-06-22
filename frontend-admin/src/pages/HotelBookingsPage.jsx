import { BookingsListView } from './BookingsPage';

export default function HotelBookingsPage() {
  return (
    <BookingsListView
      productCategory="hotel"
      title="Hotel Booking"
      description="Hotel reservations and stay bookings."
      newBookingPath="/bookings/new?category=hotel"
    />
  );
}
