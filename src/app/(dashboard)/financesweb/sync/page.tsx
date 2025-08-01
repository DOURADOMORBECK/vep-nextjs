import { FinanceswebSync } from '@/components/financesweb/FinanceswebSync';

export default function FinanceswebSyncPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Sincronização FinancesWeb</h1>
      <FinanceswebSync />
    </div>
  );
}