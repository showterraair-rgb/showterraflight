import { Navigate } from 'react-router-dom';

export default function InstantPaymentPage() {
  return <Navigate to="/payments/customers?instant=1" replace />;
}
