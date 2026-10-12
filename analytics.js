// Pure aggregation: everything is computed from the transactions passed in.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthLabel = (key) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
const dayLabel = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export function buildAnalytics(transactions) {
  const count = transactions.length;
  const empty = {
    hasData: false,
    kpis: { totalTransactions: 0, highestAmount: 0, lowestAmount: 0, averageAmount: 0 },
    categoryTotals: [],
    categoryShare: [],
    monthlyTrend: [],
    incomeExpense: { income: 0, expenses: 0, chart: [] },
    timeline: [],
    topCategories: [],
  };
  if (count === 0) return empty;

  let sum = 0, max = -Infinity, min = Infinity, income = 0, expenses = 0;
  const cats = new Map();
  const months = new Map();
  const days = new Map();

  for (const t of transactions) {
    const a = t.amount;
    sum += a;
    if (a > max) max = a;
    if (a < min) min = a;
    if (a > 0) income += a;
    else if (a < 0) expenses += -a;

    const c = cats.get(t.category) || { category: t.category, total: 0, absolute: 0, count: 0 };
    c.total += a;
    c.absolute += Math.abs(a);
    c.count += 1;
    cats.set(t.category, c);

    if (t.date) {
      const key = t.date.slice(0, 7);
      const m = months.get(key) || { month: key, income: 0, expenses: 0, net: 0, count: 0 };
      if (a > 0) m.income += a;
      else m.expenses += -a;
      m.net += a;
      m.count += 1;
      months.set(key, m);
      days.set(t.date, (days.get(t.date) || 0) + a);
    }
  }

  const catList = [...cats.values()];

  const categoryTotals = catList
    .map((c) => ({ category: c.category, total: round2(c.total) }))
    .sort((a, b) => b.total - a.total);

  // Pie: top 8 by count, remainder grouped into "Other"
  const byCount = [...catList].sort((a, b) => b.count - a.count);
  const head = byCount.slice(0, 8).map((c) => ({ category: c.category, count: c.count }));
  const restCount = byCount.slice(8).reduce((s, c) => s + c.count, 0);
  if (restCount > 0) head.push({ category: 'Other', count: restCount });
  const categoryShare = head.map((c) => ({ ...c, percent: round2((c.count / count) * 100) }));

  const monthlyTrend = [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      month: m.month,
      label: monthLabel(m.month),
      income: round2(m.income),
      expenses: round2(m.expenses),
      net: round2(m.net),
      count: m.count,
    }));

  let running = 0;
  const timeline = [...days.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, net]) => {
      running += net;
      return { date, label: dayLabel(date), net: round2(net), balance: round2(running) };
    });

  const topCategories = [...catList]
    .sort((a, b) => b.absolute - a.absolute)
    .slice(0, 5)
    .map((c) => ({ category: c.category, total: round2(c.absolute) }));

  return {
    hasData: true,
    kpis: {
      totalTransactions: count,
      highestAmount: round2(max),
      lowestAmount: round2(min),
      averageAmount: round2(sum / count),
    },
    categoryTotals,
    categoryShare,
    monthlyTrend,
    incomeExpense: {
      income: round2(income),
      expenses: round2(expenses),
      chart: [
        { name: 'Income', value: round2(income) },
        { name: 'Expenses', value: round2(expenses) },
      ],
    },
    timeline,
    topCategories,
  };
}
