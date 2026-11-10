import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PostCard, { type PostSummary } from './PostCard';

const post: PostSummary = {
  id: 7,
  title: 'A post about testing',
  content: 'The body of the post. '.repeat(20),
  author_name: 'Vamsi',
  created_at: '2026-03-14T10:00:00.000Z',
};

function renderCard(overrides: Partial<React.ComponentProps<typeof PostCard>> = {}) {
  return render(
    <MemoryRouter>
      <PostCard post={post} {...overrides} />
    </MemoryRouter>
  );
}

describe('PostCard', () => {
  it('links the title and the read-more affordance to the post', () => {
    renderCard();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/post/7');
    }
  });

  it('shows the author, date and reading time', () => {
    renderCard();
    expect(screen.getByText('Vamsi')).toBeInTheDocument();
    expect(screen.getByText(/March 14, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });

  it('falls back to a placeholder when the row has no author name', () => {
    renderCard({ post: { ...post, author_name: undefined } });
    expect(screen.getByText('Unknown author')).toBeInTheDocument();
  });

  it('prefers an explicit authorName over the row value', () => {
    renderCard({ authorName: 'Explicit Name' });
    expect(screen.getByText('Explicit Name')).toBeInTheDocument();
    expect(screen.queryByText('Vamsi')).not.toBeInTheDocument();
  });

  it('truncates a long body rather than rendering all of it', () => {
    renderCard();
    expect(screen.getByText(/…$/)).toBeInTheDocument();
  });

  it('renders caller-supplied actions, used by the My Blogs page', () => {
    renderCard({ actions: <button type="button">Delete</button> });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders post titles as text, never as markup', () => {
    // React escapes by default; this asserts nobody has introduced
    // dangerouslySetInnerHTML on the title path.
    renderCard({ post: { ...post, title: '<img src=x onerror=alert(1)>' } });
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
