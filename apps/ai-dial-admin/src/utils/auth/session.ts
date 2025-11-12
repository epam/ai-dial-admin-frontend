import { Session } from 'next-auth';

interface ValidSession extends Session {
  error?: string;
}

const isValidSession = (session: ValidSession | null): boolean => {
  return !!session && session.error !== 'RefreshAccessTokenError' && session.error !== 'NoClientForProvider';
};

export function isClientSessionValid(session: Session | null) {
  return isValidSession(session);
}

export function isServerSessionValid(session: Session | null) {
  return isValidSession(session);
}
