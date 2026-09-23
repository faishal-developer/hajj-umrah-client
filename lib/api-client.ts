import { ApiResponse } from '@/types/api';
import { generateUUID } from './utils';
import { translateErrorMessage, FriendlyError } from './error-translator';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://hajj-umrah-backend.vercel.app/api/v1';

export class ApiClientError extends Error {
  statusCode: number;
  code?: string;
  error?: string;
  friendly: FriendlyError;

  constructor(message: string, statusCode: number = 500, code?: string, error?: string) {
    const friendly = translateErrorMessage(message, statusCode, code);
    super(friendly.description);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.error = error;
    this.friendly = friendly;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hajj_auth_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('hajj_auth_token', token);
    document.cookie = `hajj_auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    localStorage.removeItem('hajj_auth_token');
    document.cookie = `hajj_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { idempotencyKey, requiresAuth = true, headers = {}, ...restOptions } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token && requiresAuth) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey;
  } else if (
    ['POST', 'PATCH', 'PUT'].includes(options.method?.toUpperCase() || '') &&
    (endpoint.includes('/bookings') ||
      endpoint.includes('/payments') ||
      endpoint.includes('/cancellations'))
  ) {
    requestHeaders['Idempotency-Key'] = generateUUID();
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    const contentType = res.headers.get('content-type');
    let data: Record<string, unknown> | null = null;

    if (contentType && contentType.includes('application/json')) {
      data = (await res.json()) as Record<string, unknown>;
    } else {
      const text = await res.text();
      data = { message: text || res.statusText };
    }

    if (!res.ok) {
      let errorMessage = 'An error occurred';
      if (data?.message) {
        errorMessage = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      }
      throw new ApiClientError(
        errorMessage,
        res.status,
        typeof data?.code === 'string' ? data.code : undefined,
        typeof data?.error === 'string' ? data.error : undefined
      );
    }

    if (data && typeof data === 'object' && 'data' in data) {
      return data as unknown as ApiResponse<T>;
    }

    return {
      data: data as unknown as T,
      message: 'Success',
    };
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Network communication error';
    throw new ApiClientError(message, 500);
  }
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(endpoint: string, options?: RequestOptions) {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
