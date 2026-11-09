import axios from 'axios';

interface ApiErrorBody {
  message?: string;
  code?: string;
  /** Zod issues from the backend's validation middleware. */
  errors?: Array<{ message?: string; path?: unknown }>;
}

/**
 * Extracts the message the API actually sent.
 *
 * `api` rejects with the raw AxiosError, whose `.message` is a generic
 * "Request failed with status code 401". The backend's real message lives in
 * `response.data.message`, so read that first and only fall back afterwards.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;

    // Validation failures carry the useful detail in `errors`, while `message`
    // is only the generic "Validation failed".
    const issue = body?.errors?.find(entry => Boolean(entry.message))?.message;
    if (issue) return issue;

    if (body?.message) return body.message;

    // No response at all means the request never reached the server.
    if (!error.response) {
      return 'No connection. Check your network and try again.';
    }
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

/** The backend's machine-readable error code, when present. */
export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorBody | undefined)?.code;
  }
  return undefined;
}

/** True when the failure was a network/timeout problem rather than a rejection. */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
