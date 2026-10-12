import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseWorkbook } from './parser.js';
import { ValidationError } from './normalize.js';
import { buildAnalytics } from './analytics.js';
import { getStore, setStore } from './store.js';
import { buildSampleWorkbookBuffer } from './sample.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function createApp() {
  const app = express();
  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins }));

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1 } });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return next(err);
      try {
        const file = req.file;
        if (!file) throw new ValidationError('No file received. Choose an .xlsx file to upload.');
        if (!/\.xlsx$/i.test(file.originalname)) {
          throw new ValidationError('Only .xlsx files are accepted.');
        }
        // Parse + validate first; the stored dataset is replaced only on full success.
        const { transactions, warnings } = parseWorkbook(file.buffer);
        setStore({ transactions, fileName: file.originalname, warnings });
        res.json({
          message: 'File imported successfully.',
          fileName: file.originalname,
          rowCount: transactions.length,
          warnings,
        });
      } catch (e) {
        next(e);
      }
    });
  });

  app.get('/api/analytics', (_req, res) => {
    const { transactions, fileName, uploadedAt, warnings } = getStore();
    res.json({
      ...buildAnalytics(transactions),
      meta: { fileName, uploadedAt, rowCount: transactions.length, warnings },
    });
  });

  app.get('/api/transactions', (_req, res) => {
    const { transactions, fileName } = getStore();
    res.json({ fileName, count: transactions.length, transactions });
  });

  app.get('/api/sample', (_req, res) => {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-transactions.xlsx"');
    res.send(buildSampleWorkbookBuffer());
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ValidationError) return res.status(err.status).json({ error: err.message });
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large (maximum 5 MB).' });
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Upload a single file in the "file" field.' });
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  });

  return app;
}
