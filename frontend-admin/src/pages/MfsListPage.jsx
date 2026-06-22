import { PaymentAccountsPanel } from './PaymentAccountsPage';

export default function MfsListPage() {
  return (
    <PaymentAccountsPanel
      title="MFS List"
      description="bKash and Nagad mobile financial service accounts"
      allowedTypes={['bkash', 'nagad']}
      defaultType="bkash"
      lockTypeOnCreate
    />
  );
}
