const config = {
  apiUrl: import.meta.env.PROD 
    ? 'https://blog-api-xxxx.onrender.com/api' // Replace 'blog-api-xxxx' with your actual Render service name
    : 'http://localhost:4000/api',
};

export default config; 