import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard, { PostSummary } from '../components/PostCard';
import { PageLoader } from '../components/Spinner';
import Alert from '../components/Alert';
import { getErrorMessage } from '../utils/errors';

const MyBlogs = () => {
  const [blogPosts, setBlogPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state } = useAuth();
  const { user } = state;

  useEffect(() => {
    posts
      .getUserPosts()
      .then((response) => setBlogPosts(response.data))
      .catch((err) => setError(getErrorMessage(err, 'Failed to fetch your posts.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">My Blog Posts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage everything you have published.</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New post
        </Link>
      </div>

      {loading ? (
        <PageLoader label="Loading your posts" />
      ) : error ? (
        <div className="mx-auto max-w-xl">
          <Alert>{error}</Alert>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="mx-auto max-w-md rounded-xl border-2 border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">You haven't written anything yet</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Your published posts will show up here.</p>
          <Link
            to="/create"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorName={user?.name}
              actions={
                <Link
                  to={`/edit/${post.id}`}
                  className="rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  Edit
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBlogs;
