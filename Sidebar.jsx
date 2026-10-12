const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { href: '#overview', label: 'Overview', d: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '#charts', label: 'Analytics', d: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  { href: '#transactions', label: 'Transactions', d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
];

export default function Sidebar({ fileName }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">F</span>
        <span className="brand-name">FinLens</span>
      </div>
      <nav className="nav">
        {NAV.map((n, i) => (
          <a key={n.href} href={n.href} className={i === 0 ? 'nav-link active' : 'nav-link'}>
            <Icon d={n.d} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="muted-label">Active dataset</span>
        <span className="dataset-name" title={fileName || ''}>{fileName || 'None uploaded'}</span>
      </div>
    </aside>
  );
}
