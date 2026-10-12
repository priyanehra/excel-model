const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatINR = (n) => inr.format(Number.isFinite(n) ? n : 0);

export function compactINR(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const f = (v, s) => `${sign}₹${Number(v.toFixed(1))}${s}`;
  if (abs >= 1e7) return f(abs / 1e7, 'Cr');
  if (abs >= 1e5) return f(abs / 1e5, 'L');
  if (abs >= 1e3) return f(abs / 1e3, 'K');
  return `${sign}₹${Math.round(abs)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso) {
  if (!iso) return '—';
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

export const truncate = (s, n = 12) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
