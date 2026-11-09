import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="mx-auto max-w-md px-4 py-24 text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">404</p>
    <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">Page not found</h1>
    <p className="mt-3 text-gray-600 dark:text-gray-400">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-8 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
      Go home
    </Link>
  </div>
);

export default NotFound;
