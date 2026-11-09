import { useState } from 'react';
import Alert from './Alert';
import { Spinner } from './Spinner';

const MAX_TITLE = 255;

interface PostFormProps {
  heading: string;
  description?: string;
  initialTitle?: string;
  initialContent?: string;
  submitLabel: string;
  submittingLabel: string;
  error?: string;
  onSubmit: (data: { title: string; content: string }) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900/40 dark:text-white dark:placeholder:text-gray-500';

export default function PostForm({
  heading,
  description,
  initialTitle = '',
  initialContent = '',
  submitLabel,
  submittingLabel,
  error,
  onSubmit,
  onCancel,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700 sm:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{heading}</h1>
          {description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          {error && <Alert>{error}</Alert>}

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title"
              maxLength={MAX_TITLE}
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">{content.length.toLocaleString()} characters</span>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post… Blank lines start new paragraphs."
              rows={14}
              className={`${inputClass} leading-relaxed`}
              required
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-gray-800"
            >
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
