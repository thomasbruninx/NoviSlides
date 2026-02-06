import { EDITOR_SESSION_COOKIE_NAME, REMEMBER_ME_MAX_AGE_SECONDS } from './constants';

const useSecureCookies = process.env.EDITOR_AUTH_COOKIE_SECURE === 'true';

export function buildEditorSessionCookie(token: string, rememberMe: boolean) {
  return {
    name: EDITOR_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: useSecureCookies,
    path: '/',
    ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE_SECONDS } : {})
  };
}

export function buildExpiredEditorSessionCookie() {
  return {
    name: EDITOR_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: useSecureCookies,
    path: '/',
    maxAge: 0
  };
}
