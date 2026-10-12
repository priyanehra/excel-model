import { useMemo, useState } from 'react';
import { formatDate, formatINR } from '../format.js';

const PAGE_SIZE = 10;

export default function TransactionTable({ transactions }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? transactions.filter((t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      : transactions;
    // newest first; undated rows last
    return [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="card table-card" id="transactions">
      <div className="table-head">
        <h3>Transactions</h3>
        <input
          className="search"
          type="search"
          placeholder="Search description or category"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan="4" className="empty-row">No matching transactions</td></tr>
            ) : (
              slice.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td><span className="chip">{t.category}</span></td>
                  <td className={`num ${t.amount < 0 ? 'neg' : 'pos'}`}>{formatINR(t.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>
          {rows.length === 0 ? '0' : `${current * PAGE_SIZE + 1}–${Math.min(rows.length, (current + 1) * PAGE_SIZE)}`} of {rows.length.toLocaleString('en-IN')}
        </span>
        <div>
          <button className="btn btn-ghost btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
          <button className="btn btn-ghost btn-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
