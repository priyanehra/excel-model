// Latest valid dataset, held in server memory (no database).
let state = { transactions: [], fileName: null, uploadedAt: null, warnings: [] };

export const getStore = () => state;

export function setStore({ transactions, fileName, warnings }) {
  state = { transactions, fileName, warnings, uploadedAt: new Date().toISOString() };
}
