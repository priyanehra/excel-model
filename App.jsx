import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import KpiCards from './components/KpiCards.jsx';
import Charts from './components/Charts.jsx';
import TransactionTable from './components/TransactionTable.jsx';
import { getAnalytics, getTransactions, uploadFile, SAMPLE_URL } from './api.js';

export default function App() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const refresh = useCallback(async () => {
    const [a, t] = await Promise.all([getAnalytics(), getTransactions()]);
    setAnalytics(a);
    setTransactions(t.transactions);
  }, []);

  useEffect(() => {
    refresh()
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setBooting(false));
  }, [refresh]);

  const handleUpload = async (file) => {
    setStatus(null);
    if (!/\.xlsx$/i.test(file.name)) {
      setStatus({ type: 'error', text: 'Only .xlsx files are accepted.' });
      return;
    }
    setLoading(true);
    try {
      const res = await uploadFile(file);
      await refresh();
      setStatus({ type: 'success', text: `Imported ${res.rowCount} transactions from ${res.fileName}.`, warnings: res.warnings });
    } catch (e) {
      // Server keeps the previous valid dataset untouched on any failure.
      setStatus({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const hasData = analytics?.hasData;

  return (
    <div className="app">
      <Sidebar fileName={analytics?.meta?.fileName} />
      <div className="main">
        <header className="topbar">
          <div>
            <h1>Transaction Analytics</h1>
            <p>Upload an Excel file to explore spending, income and trends.</p>
          </div>
          <a className="btn btn-ghost btn-sm" href={SAMPLE_URL} download>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
            </svg>
            Sample .xlsx
          </a>
        </header>

        <main className="content">
          <UploadPanel onUpload={handleUpload} loading={loading} meta={analytics?.meta} status={status} />

          {booting ? (
            <div className="card empty">Loading…</div>
          ) : hasData ? (
            <>
              <KpiCards kpis={analytics.kpis} />
              <Charts data={analytics} />
              <TransactionTable transactions={transactions} />
            </>
          ) : (
            <div className="card empty">
              <h3>No data yet</h3>
              <p>Upload an .xlsx file with Date, Description, Category and Amount columns, or download the sample file to try it out.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
