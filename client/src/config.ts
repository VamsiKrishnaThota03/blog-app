// VITE_API_URL overrides the API base URL at build time (e.g. on Vercel).
// In development the Vite dev server proxies /api to http://localhost:4000.
const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? 'https://blog-api-rer9.onrender.com/api' : '/api'),
};

export default config;
