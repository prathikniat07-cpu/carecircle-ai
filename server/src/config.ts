export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dbPath: process.env.DATABASE_PATH || process.env.DB_PATH || './data/carecircle.db',
  isDemoMode: !process.env.GEMINI_API_KEY,
} as const;
