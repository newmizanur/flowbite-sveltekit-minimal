import { createHmac, timingSafeEqual } from 'crypto';

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
  const data = toBase64Url(Buffer.from(JSON.stringify(payload)).toString('base64'));
  const mac = toBase64Url(createHmac('sha256', secret).update(data).digest('base64'));
  return `${data}.${mac}`;
}

export function verifySession(token: string, secret: string): SessionPayload | null {
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
    return JSON.parse(Buffer.from(fromBase64Url(data), 'base64').toString()) as SessionPayload;
  } catch {
    return null;
  }
}
