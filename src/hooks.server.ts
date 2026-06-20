import { redirect, type Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/session';
import { SESSION_SECRET } from '$env/static/private';

const PROTECTED_PATHS = ['/crud'];

const AUTH_PAGES = ['/authentication/sign-in', '/authentication/sign-up'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');
  const payload = token ? verifySession(token, SESSION_SECRET) : null;

  event.locals.user = payload;

  const { pathname } = event.url;

  if (isProtected(pathname) && !payload) {
    throw redirect(303, '/authentication/sign-in');
  }

  if (isAuthPage(pathname) && payload) {
    throw redirect(303, '/crud/users');
  }

  return resolve(event);
};
