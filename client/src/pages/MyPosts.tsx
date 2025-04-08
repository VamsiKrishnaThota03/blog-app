import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../services/api';
import { Post } from '../types';
import { formatDate } from '../utils/date';

const MyPosts = () => {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await posts.getUserPosts();
        setUserPosts(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch your posts');
        console.error('Error fetching user posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 dark:bg-gray-900">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Posts</h1>
        {userPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't written any posts yet.</p>
            <Link
              to="/posts/new"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
            >
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {userPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  <Link to={`/posts/${post.id}`} className="hover:text-blue-500 transition duration-200">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Posted on {formatDate(post.created_at)}</span>
                  <div className="space-x-4">
                    <Link
                      to={`/posts/${post.id}/edit`}
                      className="text-blue-500 hover:text-blue-600 transition duration-200"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts; 