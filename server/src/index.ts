import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[CareCircle API] Server running on http://${HOST}:${PORT}`);
  console.log(`[CareCircle API] Health check: http://${HOST}:${PORT}/health (or /api/health)`);
});
