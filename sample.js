import XLSX from 'xlsx';

// Deterministic pseudo-random generator so the sample file is reproducible.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// [description, category, fixedDay|null, min, max, timesPerMonth, sign]
const TEMPLATES = [
  ['Salary Credit - Infosys Ltd', 'Salary', 1, 85000, 85000, 1, 1],
  ['Freelance Payment - UI Project', 'Freelance', null, 8000, 28000, 1, 1],
  ['Savings Account Interest', 'Interest', 28, 380, 520, 1, 1],
  ['House Rent - Vaishali Nagar', 'Rent', 5, 22000, 22000, 1, -1],
  ['DMart Groceries', 'Groceries', null, 1400, 4200, 2, -1],
  ['BigBasket Order', 'Groceries', null, 600, 2200, 1, -1],
  ['Electricity Bill - JVVNL', 'Utilities', 12, 1700, 3400, 1, -1],
  ['Airtel Broadband', 'Utilities', 10, 999, 999, 1, -1],
  ['Jio Mobile Recharge', 'Utilities', 15, 349, 349, 1, -1],
  ['Uber Ride', 'Transport', null, 150, 650, 3, -1],
  ['Petrol - Indian Oil', 'Transport', null, 900, 2200, 1, -1],
  ['Swiggy Order', 'Dining', null, 280, 820, 3, -1],
  ['Zomato Order', 'Dining', null, 250, 760, 1, -1],
  ['Netflix Subscription', 'Entertainment', 18, 649, 649, 1, -1],
  ['BookMyShow Tickets', 'Entertainment', null, 400, 1300, 1, -1],
  ['Amazon Purchase', 'Shopping', null, 700, 6500, 2, -1],
  ['Myntra Order', 'Shopping', null, 900, 3800, 1, -1],
  ['Apollo Pharmacy', 'Healthcare', null, 220, 1900, 1, -1],
  ['SIP - Mutual Fund', 'Investments', 7, 10000, 10000, 1, -1],
];

export function generateSampleTransactions() {
  const rand = rng(2025);
  const rows = [];
  for (let month = 1; month <= 6; month++) {
    for (const [desc, cat, fixedDay, min, max, times, sign] of TEMPLATES) {
      for (let k = 0; k < times; k++) {
        if (cat === 'Freelance' && month % 2 === 0) continue; // irregular income
        const day = fixedDay ?? 1 + Math.floor(rand() * 28);
        const raw = min === max ? min : min + rand() * (max - min);
        const amount = Math.round(raw * 100) / 100;
        rows.push({ year: 2025, month, day, desc, cat, amount: sign * amount });
      }
    }
  }
  return rows.sort((a, b) => a.month - b.month || a.day - b.day);
}

export function buildSampleWorkbookBuffer() {
  const aoa = [['Date', 'Description', 'Category', 'Amount']];
  for (const r of generateSampleTransactions()) {
    const serial = Date.UTC(r.year, r.month - 1, r.day) / 86400000 + 25569;
    aoa.push([
      { t: 'n', v: serial, z: 'yyyy-mm-dd' },
      r.desc,
      r.cat,
      { t: 'n', v: r.amount, z: '#,##0.00' },
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
