import { formatINR } from '../format.js';

export default function KpiCards({ kpis }) {
  const items = [
    { label: 'Total Transactions', value: kpis.totalTransactions.toLocaleString('en-IN') },
    { label: 'Highest Amount', value: formatINR(kpis.highestAmount) },
    { label: 'Lowest Amount', value: formatINR(kpis.lowestAmount) },
    { label: 'Average Amount', value: formatINR(kpis.averageAmount) },
  ];
  return (
    <section className="kpis" id="overview">
      {items.map((k) => (
        <div className="card kpi" key={k.label}>
          <span className="muted-label">{k.label}</span>
          <span className="kpi-value">{k.value}</span>
        </div>
      ))}
    </section>
  );
}
