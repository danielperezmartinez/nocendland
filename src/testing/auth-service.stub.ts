import {signal} from '@angular/core';

export function createAuthServiceStub() {
  return {
    user: signal(undefined),
    isAuthenticated: () => Promise.resolve(false),
    exchangeCodeForSession: () => Promise.resolve(undefined),
    signInWithGithub: () => Promise.resolve(undefined),
    signInWithGoogle: () => Promise.resolve(undefined),
    signOut: () => Promise.resolve(undefined),
    requireUserId: () => 'test-user',
    sanitizeReturnPath: (path: string | null | undefined) => path?.startsWith('/') ? path : '/',
  };
}
