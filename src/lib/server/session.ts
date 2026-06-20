import { createHmac, timingSafeEqual } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7
};

export function setSessionCookie(cookies: Cookies, token: string): void {
  cookies.set('session', token, SESSION_COOKIE_OPTIONS);
}

export type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(b64url: string): string {
  return b64url.replace(/-/g, '+').replace(/_/g, '/');
}

export function signSession(payload: SessionPayload, secret: string): string {
  if (!secret) throw new Error('Session secret must not be empty');
  const data = toBase64Url(Buffer.from(JSON.stringify(payload)).toString('base64'));
  const mac = toBase64Url(createHmac('sha256', secret).update(data).digest('base64'));
  return `${data}.${mac}`;
}

export function verifySession(token: string, secret: string): SessionPayload | null {
  if (!secret) throw new Error('Session secret must not be empty');
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const data = token.slice(0, dotIndex);
  const mac = token.slice(dotIndex + 1);
  if (!data || !mac) return null;

  const expected = toBase64Url(createHmac('sha256', secret).update(data).digest('base64'));

  try {
    const macBuf = Buffer.from(fromBase64Url(mac), 'base64');
    const expectedBuf = Buffer.from(fromBase64Url(expected), 'base64');
    if (macBuf.length !== expectedBuf.length || !timingSafeEqual(new Uint8Array(macBuf), new Uint8Array(expectedBuf))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const p = JSON.parse(Buffer.from(fromBase64Url(data), 'base64').toString());
    if (
      !p ||
      typeof p.id !== 'string' ||
      typeof p.name !== 'string' ||
      typeof p.email !== 'string' ||
      typeof p.role !== 'string'
    ) return null;
    return p as SessionPayload;
  } catch {
    return null;
  }
}
