import api from '../services/api';

interface CreatePostData {
  title: string;
  content: string;
}

const postsService = {
  getById: (id: string) => api.get(`/posts/${id}`),
  getMyPosts: () => api.get('/posts/user/me'),
  create: (data: CreatePostData) => api.post('/posts', data),
};

export default postsService; 