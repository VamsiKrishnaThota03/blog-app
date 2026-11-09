import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { posts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Spinner } from '../components/Spinner';
import Alert from '../components/Alert';
import { formatDate, readingTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

interface Post {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    posts
      .getOne(id!)
      .then((response) => setPost(response.data))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load post.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await posts.delete(id!);
      navigate('/my-blogs');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete post.'));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading post" />;

  if (!post) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Alert>{error || 'Post not found.'}</Alert>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          ← Back to all posts
        </Link>
      </div>
    );
  }

  const isAuthor = user != null && String(user.id) === String(post.user_id);
  const author = post.author_name || 'Unknown author';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        ← All posts
      </Link>
      <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:p-10">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200" aria-hidden="true">
              {author.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{author}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(post.created_at)} · {readingTime(post.content)}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <Link
                to={`/edit/${post.id}`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {deleting && <Spinner className="h-4 w-4" />}
                Delete
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-6">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-8 space-y-5 text-[1.05rem] leading-8 text-gray-800 dark:text-gray-200">
          {post.content
            .split(/\n{2,}|\n/)
            .filter((p) => p.trim() !== '')
            .map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
        </div>
      </article>
    </div>
  );
};

export default PostDetail;
