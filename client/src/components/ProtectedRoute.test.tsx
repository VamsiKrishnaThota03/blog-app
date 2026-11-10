import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the API module so no test touches the network. `getMe` stands in for the
// session check AuthProvider runs on mount.
const getMe = vi.fn();
vi.mock('../services/api', () => ({
  auth: {
    getMe: () => getMe(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
  posts: {},
  default: {},
}));

import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/my-blogs"
            element={
              <ProtectedRoute>
                <p>Secret content</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    getMe.mockReset();
  });

  it('redirects to the login page when there is no token', async () => {
    renderAt('/my-blogs');
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    // No token means the session endpoint is never called.
    expect(getMe).not.toHaveBeenCalled();
  });

  it('renders the children once the stored token is accepted', async () => {
    localStorage.setItem('token', 'a-valid-token');
    getMe.mockResolvedValue({ data: { id: '1', name: 'Vamsi', email: 'v@example.test' } });

    renderAt('/my-blogs');

    expect(await screen.findByText('Secret content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('shows the session check before deciding, instead of flashing the login page', async () => {
    localStorage.setItem('token', 'a-valid-token');
    let resolve: (value: unknown) => void = () => {};
    getMe.mockReturnValue(new Promise((r) => (resolve = r)));

    renderAt('/my-blogs');

    // While the check is in flight the user must see neither outcome. The
    // loader exposes its label via aria-label on role="status", not as text.
    expect(
      await screen.findByRole('status', { name: /Checking your session/i })
    ).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();

    resolve({ data: { id: '1', name: 'Vamsi', email: 'v@example.test' } });
    expect(await screen.findByText('Secret content')).toBeInTheDocument();
  });

  it('redirects to login when a stored token is rejected', async () => {
    localStorage.setItem('token', 'an-expired-token');
    getMe.mockRejectedValue(new Error('401'));

    renderAt('/my-blogs');

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});
