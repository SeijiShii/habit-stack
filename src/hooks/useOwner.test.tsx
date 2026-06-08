// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useOwner } from './useOwner.js';
import { OwnerContext, type OwnerState } from '../services/auth/ownerContext.js';
import { AuthProvider } from '../components/auth/AuthProvider.js';
import { asOwnerId } from '../types/domain.js';

const provide = (state: OwnerState) => {
  return ({ children }: { children: ReactNode }) => (
    <OwnerContext.Provider value={state}>{children}</OwnerContext.Provider>
  );
};

describe('useOwner (OwnerContext 消費)', () => {
  it('認証済み owner を返す', () => {
    const { result } = renderHook(() => useOwner(), {
      wrapper: provide({ ownerId: asOwnerId('user_42'), isLoaded: true, isLocalGuest: false }),
    });
    expect(result.current.ownerId).toBe('user_42');
    expect(result.current.isLocalGuest).toBe(false);
  });

  it('Provider 外はデフォルト（未ロード/null）', () => {
    const { result } = renderHook(() => useOwner());
    expect(result.current.ownerId).toBeNull();
    expect(result.current.isLoaded).toBe(false);
  });
});

describe('AuthProvider（キー未設定 = offline-first）', () => {
  it('publishableKey 無しでローカルゲスト owner を供給（Clerk 無しでも動作）', () => {
    localStorage.clear();
    const { result } = renderHook(() => useOwner(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AuthProvider publishableKey="">{children}</AuthProvider>
      ),
    });
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLocalGuest).toBe(true);
    expect(result.current.ownerId).toMatch(/^local-guest-/);
  });
});
