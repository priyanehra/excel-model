import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 5000;
createApp().listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
