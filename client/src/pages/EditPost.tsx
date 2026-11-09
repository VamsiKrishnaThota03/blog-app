import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { posts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/PostForm';
import { PageLoader } from '../components/Spinner';
import Alert from '../components/Alert';
import { getErrorMessage } from '../utils/errors';

interface LoadedPost {
  title: string;
  content: string;
  user_id: number;
}

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [post, setPost] = useState<LoadedPost | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    posts
      .getOne(id!)
      .then((response) => setPost(response.data))
      .catch((err) => setLoadError(getErrorMessage(err, 'Failed to load post.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader label="Loading post" />;

  const isAuthor = post && state.user && String(post.user_id) === String(state.user.id);
  if (!post || !isAuthor) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Alert>{loadError || 'You can only edit your own posts.'}</Alert>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          ← Back to all posts
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: { title: string; content: string }) => {
    setSaveError('');
    try {
      await posts.update(id!, data);
      navigate(`/post/${id}`);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to update post. Please try again.'));
    }
  };

  return (
    <PostForm
      heading="Edit post"
      initialTitle={post.title}
      initialContent={post.content}
      submitLabel="Save changes"
      submittingLabel="Saving…"
      error={saveError}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/post/${id}`)}
    />
  );
};

export default EditPost;
