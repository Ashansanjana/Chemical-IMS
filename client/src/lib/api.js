// Central API base URL — reads from env var in production (Vercel), falls back to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
