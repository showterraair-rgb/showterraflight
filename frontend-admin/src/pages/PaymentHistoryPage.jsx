import { CustomerPaymentsList } from './CustomerPaymentsPage';

export default function PaymentHistoryPage() {
  return (
    <CustomerPaymentsList
      title="Payment History"
      description="All customer payment transactions"
      showRecordButton={false}
    />
  );
}
