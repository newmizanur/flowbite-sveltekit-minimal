import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from './session';

const SECRET = 'test-secret-key';

describe('signSession', () => {
  it('returns a string with two dot-separated parts', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    expect(token.split('.').length).toBe(2);
  });
});

describe('verifySession', () => {
  it('returns the payload for a valid token', () => {
    const payload = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' };
    const token = signSession(payload, SECRET);
    const result = verifySession(token, SECRET);
    expect(result).toEqual(payload);
  });

  it('returns null for a tampered token', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    const tampered = token.slice(0, -3) + 'xyz';
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    expect(verifySession(token, 'wrong-secret')).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(verifySession('notavalidtoken', SECRET)).toBeNull();
    expect(verifySession('', SECRET)).toBeNull();
  });
});
