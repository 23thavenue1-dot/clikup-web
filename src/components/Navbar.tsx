
'use client';

import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Loader2, Image as ImageIcon, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { Skeleton } from './ui/skeleton';
import type { UserProfile } from '@/lib/firestore'; // Importer le type

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // Logique de useUserProfile intégrée ici
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const handleSignOut = async () => {
    if (!user) return; // auth est déjà inclus dans user
    try {
      await signOut(user.auth);
      toast({ title: 'Déconnexion réussie' });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de déconnexion',
        description: (error as Error).message,
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ImageIcon className="h-6 w-6 text-primary" />
          <span>Clikup</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isUserLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {isProfileLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : userProfile ? (
                 <div className="flex items-center gap-2" title={`${userProfile.ticketCount} tickets restants`}>
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-bold text-primary">{userProfile.ticketCount}</span>
                 </div>
              ) : (
                // Affiche un état de chargement ou un fallback si le profil n'est pas encore là
                <div className="flex items-center gap-2" title="Chargement des tickets...">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <Skeleton className="h-4 w-4" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Déconnexion">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
