import XLSX from 'xlsx';
import { normalizeRows, ValidationError } from './normalize.js';

/** Parse an .xlsx buffer (first sheet) into validated transactions. */
export function parseWorkbook(buffer) {
  // .xlsx files are ZIP archives: must start with "PK\x03\x04"
  if (!buffer || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    throw new ValidationError('The file is not a valid .xlsx workbook.');
  }
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    throw new ValidationError('The file could not be read. It may be corrupted or password protected.');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new ValidationError('The workbook contains no sheets.');

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  if (rows.length === 0) throw new ValidationError('The first sheet is empty.');
  const [header, ...data] = rows;
  return normalizeRows(header, data);
}
