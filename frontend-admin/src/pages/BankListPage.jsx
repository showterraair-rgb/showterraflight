import { PaymentAccountsPanel } from './PaymentAccountsPage';

export default function BankListPage() {
  return (
    <PaymentAccountsPanel
      title="Bank List"
      description="Bank accounts used to receive and send payments"
      allowedTypes={['bank']}
      defaultType="bank"
      lockTypeOnCreate
    />
  );
}
