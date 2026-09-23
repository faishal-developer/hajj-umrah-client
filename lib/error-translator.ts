/**
 * Human-readable error translation and sanitization utility.
 * Intercepts low-level database, backend, network, and HTTP errors,
 * converting them into clear, polite, and actionable messages for pilgrims.
 */

export interface FriendlyError {
  title: string;
  description: string;
}

export function translateErrorMessage(
  rawMessage: string,
  statusCode?: number,
  code?: string
): FriendlyError {
  const msg = (rawMessage || '').toLowerCase();

  const c = (code || '').toLowerCase();

  // 1. Network & Connectivity Issues
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('network communication error') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('err_connection_refused')
  ) {
    return {
      title: 'Connection Issue',
      description:
        "We're having trouble connecting to the server. Please check your internet connection and try again.",
    };
  }

  // 2. Seat Hold / Concurrency / Quota / Lock Issues (409 or message keywords)
  if (
    statusCode === 409 ||
    c.includes('seat') ||
    c.includes('lock') ||
    c.includes('conflict') ||
    msg.includes('seat') ||
    msg.includes('lock') ||
    msg.includes('concurrency') ||
    msg.includes('deadlock') ||
    msg.includes('quota') ||
    msg.includes('unavailable') ||
    msg.includes('already held') ||
    msg.includes('sold out')
  ) {
    if (msg.includes('package') || msg.includes('tier') || msg.includes('seat')) {
      return {
        title: 'Seats Currently Unavailable',
        description:
          'This seat or tier was just selected by another traveler. Please choose another package tier or try again shortly.',
      };
    }
    return {
      title: 'Action Conflict',
      description:
        'This record is currently being updated by another operation. Please refresh the page and try again.',
    };
  }

  // 3. Authentication & Session Timeouts (401 / 403)
  if (statusCode === 401 || msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('token')) {
    return {
      title: 'Session Expired',
      description: 'Your session has expired for your security. Please sign in again to continue.',
    };
  }

  if (statusCode === 403 || msg.includes('forbidden') || msg.includes('permission') || msg.includes('dual control')) {
    return {
      title: 'Access Restricted',
      description: 'You do not have permission to perform this action.',
    };
  }

  // 4. Resource Not Found (404)
  if (statusCode === 404 || msg.includes('not found')) {
    return {
      title: 'Information Not Found',
      description: 'The requested package, booking, or record could not be found. It may have been updated or removed.',
    };
  }

  // 5. Payment Failures
  if (msg.includes('payment') || msg.includes('gateway') || msg.includes('transaction') || msg.includes('charge')) {
    return {
      title: 'Payment Could Not Be Completed',
      description:
        'Your payment could not be processed. No funds were deducted. Please try again or choose another payment method.',
    };
  }

  // 6. Database / Technical Constraint Sanitization
  if (
    msg.includes('foreign key') ||
    msg.includes('unique constraint') ||
    msg.includes('duplicate key') ||
    msg.includes('sql') ||
    msg.includes('postgres') ||
    msg.includes('prisma') ||
    msg.includes('query error') ||
    msg.includes('internal server error') ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503
  ) {
    return {
      title: 'Temporary Service Interruption',
      description:
        'Our service is experiencing a brief disruption. Please try again in a few moments.',
    };
  }

  // 7. Validation / 422 / 400 Bad Request
  if (statusCode === 400 || statusCode === 422 || msg.includes('validation')) {
    return {
      title: 'Please Check Your Details',
      description:
        rawMessage && rawMessage.length < 150 && !rawMessage.includes('{')
          ? rawMessage
          : 'Some of the submitted information is incomplete or invalid. Please review and try again.',
    };
  }

  // Fallback
  return {
    title: 'Unable to Complete Request',
    description:
      rawMessage && rawMessage.length < 120 && !rawMessage.includes('{')
        ? rawMessage
        : 'An unexpected issue occurred. Please try again shortly.',
  };
}
