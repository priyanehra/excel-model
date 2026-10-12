import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRows, parseDate, parseAmount, ValidationError } from '../src/normalize.js';
import { buildAnalytics } from '../src/analytics.js';

const H = ['Date', 'Description', 'Category', 'Amount'];
const serial = (y, m, d) => Date.UTC(y, m - 1, d) / 86400000 + 25569;

test('parseDate handles serials, strings, invalid', () => {
  assert.equal(parseDate(serial(2025, 3, 15)), '2025-03-15');
  assert.equal(parseDate('2025-03-15'), '2025-03-15');
  assert.equal(parseDate('15/03/2025'), '2025-03-15');
  assert.equal(parseDate('15 Mar 2025'), '2025-03-15');
  assert.equal(parseDate('31/02/2025'), null);
  assert.equal(parseDate('garbage'), null);
  assert.equal(parseDate(null), null);
});

test('parseAmount', () => {
  assert.equal(parseAmount(12.5), 12.5);
  assert.equal(parseAmount('₹1,250.50'), 1250.5);
  assert.equal(parseAmount('(500)'), -500);
  assert.ok(Number.isNaN(parseAmount('abc')));
  assert.ok(Number.isNaN(parseAmount(Infinity)));
  assert.ok(Number.isNaN(parseAmount(null)));
});

test('missing columns rejected', () => {
  assert.throws(() => normalizeRows(['Date', 'Amount'], [[1, 2]]), /Missing required column/);
});

test('invalid amount rejects whole file', () => {
  const rows = [[serial(2025, 1, 1), 'a', 'X', 10], [serial(2025, 1, 2), 'b', 'X', 'oops']];
  assert.throws(() => normalizeRows(H, rows), (e) => e instanceof ValidationError && /row 3/.test(e.message));
});

test('missing values handled; blank rows skipped; headers case-insensitive', () => {
  const { transactions, warnings } = normalizeRows(['amount', 'DATE', 'category', 'description'], [
    [10, 'bad-date', '', ''],
    [null, null, null, null],
  ]);
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].date, null);
  assert.equal(transactions[0].category, 'Uncategorized');
  assert.equal(warnings.length, 2);
});

test('empty file rejected', () => {
  assert.throws(() => normalizeRows(H, []), /no transaction rows/);
});

const data = [
  { date: '2025-01-05', category: 'Salary', amount: 1000 },
  { date: '2025-01-10', category: 'Food', amount: -200 },
  { date: '2025-02-03', category: 'Food', amount: -100 },
  { date: '2025-02-04', category: 'Rent', amount: -500 },
  { date: null, category: 'Misc', amount: 50 },
];

test('KPIs and aggregates', () => {
  const a = buildAnalytics(data);
  assert.deepEqual(a.kpis, { totalTransactions: 5, highestAmount: 1000, lowestAmount: -500, averageAmount: 50 });
  assert.equal(a.incomeExpense.income, 1050);
  assert.equal(a.incomeExpense.expenses, 800);
  assert.deepEqual(a.categoryTotals.find((c) => c.category === 'Food'), { category: 'Food', total: -300 });
  assert.equal(a.monthlyTrend.length, 2); // undated row excluded
  assert.equal(a.monthlyTrend[0].label, 'Jan 2025');
  assert.equal(a.topCategories[0].category, 'Salary');
  assert.equal(a.topCategories[1].category, 'Rent');
  assert.equal(a.categoryShare.reduce((s, c) => s + c.count, 0), 5);
  assert.equal(a.timeline.at(-1).balance, 200); // dated rows only: 1000-200-100-500
});

test('top five limited to five', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ date: '2025-01-01', category: `C${i}`, amount: i + 1 }));
  const a = buildAnalytics(many);
  assert.equal(a.topCategories.length, 5);
  assert.equal(a.topCategories[0].category, 'C8');
  assert.equal(a.categoryShare.at(-1).category, 'Other');
});

test('empty data has no NaN', () => {
  const a = buildAnalytics([]);
  assert.equal(a.hasData, false);
  assert.equal(a.kpis.averageAmount, 0);
});
