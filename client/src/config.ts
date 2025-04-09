const config = {
  apiUrl: import.meta.env.PROD 
    ? 'https://blog-api-rer9.onrender.com/api' // Your Render service URL
    : 'http://localhost:4000/api',
};

export default config; 