import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard, { PostSummary } from '../components/PostCard';
import { PageLoader } from '../components/Spinner';
import Alert from '../components/Alert';
import { getErrorMessage } from '../utils/errors';

const Home = () => {
  const { state } = useAuth();
  const [blogPosts, setBlogPosts] = useState<PostSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    posts
      .getAll(currentPage)
      .then((response) => {
        if (cancelled) return;
        setBlogPosts(response.data.posts);
        setTotalPages(response.data.totalPages);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load posts.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, reloadKey]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Latest Blog Posts
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Discover stories and insights from the community.
        </p>
      </div>

      {loading ? (
        <PageLoader label="Loading posts" />
      ) : error ? (
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <Alert>{error}</Alert>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="mx-auto max-w-md rounded-xl border-2 border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No posts yet</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Be the first to share something.</p>
          <Link
            to={state.isAuthenticated ? '/create' : '/register'}
            className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {state.isAuthenticated ? 'Write a post' : 'Create an account'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav className="mt-12 flex justify-center" aria-label="Pagination">
          <div className="inline-flex -space-x-px rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => goToPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center rounded-l-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Previous page</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => goToPage(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`inline-flex items-center border px-4 py-2 text-sm font-medium ${
                  currentPage === page
                    ? 'z-10 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center rounded-r-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Next page</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Home;
