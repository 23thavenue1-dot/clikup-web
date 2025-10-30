
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';

// Correspond à la structure dans backend.json
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  creationTimestamp: any; // Firestore Timestamp
  ticketCount: number;
  lastTicketRefill: any; // Firestore Timestamp
}

export interface UserProfileHookResult {
  user: AuthUser | null;
  isUserLoading: boolean;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get both Firebase Auth user and their Firestore profile data.
 * @returns An object with auth user, profile data, loading states, and error.
 */
export const useUserProfile = (): UserProfileHookResult => {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<UserProfile>(userDocRef);

  return {
    user,
    isUserLoading,
    userProfile,
    isProfileLoading,
    error: userError || profileError,
  };
};
