import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

/** Build an AxiosError the way axios itself flags one, so isAxiosError passes. */
function axiosError(response?: { status: number; data: unknown }): AxiosError {
  const error = new AxiosError('request failed');
  if (response) {
    error.response = {
      status: response.status,
      statusText: '',
      data: response.data,
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

describe('getErrorMessage', () => {
  it("surfaces the API's own message when there is one", () => {
    const error = axiosError({ status: 400, data: { message: 'User already exists' } });
    expect(getErrorMessage(error, 'fallback')).toBe('User already exists');
  });

  it('explains a network failure instead of showing the fallback', () => {
    // No response at all: the server was never reached.
    expect(getErrorMessage(axiosError(), 'fallback')).toMatch(/Cannot reach the server/);
  });

  it('falls back when the response body has no usable message', () => {
    expect(getErrorMessage(axiosError({ status: 500, data: {} }), 'fallback')).toBe('fallback');
    expect(getErrorMessage(axiosError({ status: 500, data: { message: '' } }), 'fallback')).toBe(
      'fallback'
    );
    expect(getErrorMessage(axiosError({ status: 500, data: { message: 42 } }), 'fallback')).toBe(
      'fallback'
    );
    expect(getErrorMessage(axiosError({ status: 500, data: 'plain text' }), 'fallback')).toBe(
      'fallback'
    );
  });

  it('falls back for anything that is not an axios error', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(getErrorMessage('boom', 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
