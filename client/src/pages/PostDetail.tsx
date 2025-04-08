import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posts } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  author?: {
    id: string;
    name: string;
  };
  user_id?: string;
  created_at: string;
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await posts.getOne(id!);
        setPost(response.data);
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await posts.delete(id!);
        navigate('/');
      } catch (err) {
        setError('Failed to delete post');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        {error || 'Post not found'}
      </div>
    );
  }

  const isAuthor = user?.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              By {post.author_name || post.author?.name || 'Unknown'} on{' '}
              {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Date not available'}
            </div>
            {isAuthor && (
              <div className="space-x-4">
                <button
                  onClick={() => navigate(`/edit/${post.id}`)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-800 dark:text-gray-200">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};

export default PostDetail; 