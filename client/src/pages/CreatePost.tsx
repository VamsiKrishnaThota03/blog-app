import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posts } from '../services/api';
import PostForm from '../components/PostForm';
import { getErrorMessage } from '../utils/errors';

const CreatePost = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (data: { title: string; content: string }) => {
    setError('');
    try {
      const response = await posts.create(data);
      navigate(`/post/${response.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create post. Please try again.'));
    }
  };

  return (
    <PostForm
      heading="Create a new post"
      description="Share your thoughts, ideas and knowledge with the community."
      submitLabel="Publish"
      submittingLabel="Publishing…"
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
    />
  );
};

export default CreatePost;
