'use client';
import { useMemo } from 'react';
import type { Query, DocumentReference } from 'firebase/firestore';

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

/**
 * A wrapper around useMemo that provides a stable reference to a Firestore query or document.
 * This is crucial for preventing infinite loops in `useCollection` and `useDoc` hooks.
 * @param factory A function that returns a Firestore query or document reference.
 * @param deps The dependency array for the useMemo hook.
 * @returns A memoized Firestore query or document reference.
 */
export function useMemoFirebase<T extends Query | DocumentReference>(
  factory: () => T | null | undefined,
  deps: React.DependencyList
): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRef = useMemo(factory, deps);
  if (memoizedRef) {
    (memoizedRef as any).__memo = true;
  }
  return memoizedRef as T | null;
}
