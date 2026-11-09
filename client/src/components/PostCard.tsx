import { Link } from 'react-router-dom';
import { excerpt, formatDate, readingTime } from '../utils/date';

export interface PostSummary {
  id: number | string;
  title: string;
  content: string;
  author_name?: string;
  created_at: string;
}

interface PostCardProps {
  post: PostSummary;
  authorName?: string;
  actions?: React.ReactNode;
}

export default function PostCard({ post, authorName, actions }: PostCardProps) {
  const author = authorName || post.author_name || 'Unknown author';
  return (
    <article className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
          aria-hidden="true"
        >
          {author.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{author}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(post.created_at)} · {readingTime(post.content)}
          </p>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2">
        <Link
          to={`/post/${post.id}`}
          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">
        {excerpt(post.content)}
      </p>

      <div className="flex items-center justify-between">
        <Link
          to={`/post/${post.id}`}
          className="inline-flex items-center gap-1 rounded text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Read more
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        {actions}
      </div>
    </article>
  );
}
