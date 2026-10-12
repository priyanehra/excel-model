// Pure validation/normalisation of spreadsheet rows (no I/O, easy to unit test).

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export const REQUIRED_COLUMNS = ['Date', 'Description', 'Category', 'Amount'];
export const MAX_ROWS = 50000;

const pad = (n) => String(n).padStart(2, '0');

function validYmd(y, m, d) {
  if (y < 1900 || y > 2200) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function fromSerial(n) {
  if (!Number.isFinite(n) || n < 1 || n > 2958465) return null;
  const dt = new Date((Math.floor(n) - 25569) * 86400000);
  return validYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Returns an ISO "YYYY-MM-DD" string, or null when missing/invalid. */
export function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : validYmd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  }
  if (typeof v === 'number') return fromSerial(v);

  const s = String(v).trim();
  if (!s) return null;
  let m;
  if (/^\d+(\.\d+)?$/.test(s)) return fromSerial(Number(s)); // serial stored as text
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/))) return validYmd(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    // day-first (Indian convention); fall back to month-first if day-first is impossible
    return validYmd(+m[3], +m[2], +m[1]) || validYmd(+m[3], +m[1], +m[2]);
  }
  const t = new Date(s); // e.g. "15 Jan 2025", "Jan 15, 2025"
  if (Number.isNaN(t.getTime())) return null;
  return validYmd(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

/** Returns a finite number, or NaN when the value is not a valid amount. */
export function parseAmount(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v !== 'string') return NaN;
  let s = v.trim().replace(/₹|rs\.?|inr/gi, '').replace(/[,\s]/g, '');
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -Math.abs(n) : n;
}

const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';

/**
 * @param {any[]} headerRow first row of the sheet
 * @param {any[][]} dataRows remaining rows (arrays)
 * @returns {{transactions: object[], warnings: string[]}}
 */
export function normalizeRows(headerRow, dataRows) {
  const headers = (headerRow || []).map((h) => (isBlank(h) ? '' : String(h).trim().toLowerCase()));
  const idx = {};
  const missing = [];
  for (const name of REQUIRED_COLUMNS) {
    const i = headers.indexOf(name.toLowerCase());
    if (i === -1) missing.push(name);
    else idx[name] = i;
  }
  if (missing.length) {
    throw new ValidationError(
      `Missing required column(s): ${missing.join(', ')}. Expected headers: ${REQUIRED_COLUMNS.join(', ')}.`
    );
  }
  if (dataRows.length > MAX_ROWS + 1000) {
    throw new ValidationError(`Too many rows. Maximum supported is ${MAX_ROWS}.`);
  }

  const transactions = [];
  const badAmounts = [];
  let undated = 0;
  let uncategorized = 0;

  dataRows.forEach((row, i) => {
    const cells = Object.values(idx).map((c) => row[c]);
    if (cells.every(isBlank)) return; // skip fully blank rows
    const excelRow = i + 2;
    const rawAmount = row[idx.Amount];
    const amount = isBlank(rawAmount) ? NaN : parseAmount(rawAmount);
    if (Number.isNaN(amount)) {
      badAmounts.push(`row ${excelRow} (${isBlank(rawAmount) ? 'empty' : `"${String(rawAmount).slice(0, 20)}"`})`);
      return;
    }
    const date = parseDate(row[idx.Date]);
    if (!date) undated += 1;
    const category = isBlank(row[idx.Category]) ? 'Uncategorized' : String(row[idx.Category]).trim();
    if (category === 'Uncategorized') uncategorized += 1;
    const description = isBlank(row[idx.Description]) ? '—' : String(row[idx.Description]).trim();
    transactions.push({ id: transactions.length + 1, date, description, category, amount });
  });

  if (badAmounts.length) {
    const shown = badAmounts.slice(0, 5).join(', ');
    const more = badAmounts.length > 5 ? ` and ${badAmounts.length - 5} more` : '';
    throw new ValidationError(
      `Invalid Amount in ${badAmounts.length} row(s): ${shown}${more}. Amounts must be finite numbers. Nothing was imported.`
    );
  }
  if (transactions.length === 0) throw new ValidationError('The file has no transaction rows.');
  if (transactions.length > MAX_ROWS) throw new ValidationError(`Too many rows. Maximum supported is ${MAX_ROWS}.`);

  const warnings = [];
  if (undated) warnings.push(`${undated} row(s) had a missing or invalid date and are excluded from time-based charts.`);
  if (uncategorized) warnings.push(`${uncategorized} row(s) had no category and were labelled "Uncategorized".`);
  return { transactions, warnings };
}
