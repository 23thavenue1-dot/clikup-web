
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ClipboardList, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { SocialAuditOutput } from '@/ai/schemas/social-audit-schemas';

type AuditReport = SocialAuditOutput & {
    id: string;
    createdAt: any; // Timestamp
    platform: string;
    goal: string;
}

export default function AuditHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const auditsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/audits`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);
    const { data: audits, isLoading: areAuditsLoading } = useCollection<AuditReport>(auditsQuery);
    
    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        router.push('/login?redirect=/audit');
        return null;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <Button variant="ghost" asChild className="mb-4 -ml-4">
                        <Link href="/audit">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour au Coach Stratégique
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Historique des Analyses</h1>
                    <p className="text-muted-foreground">Retrouvez ici tous les rapports d'audit générés par l'IA.</p>
                </header>
                
                {areAuditsLoading ? (
                     <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader><div className="h-6 w-1/2 bg-muted rounded-md"></div></CardHeader>
                                <CardContent><div className="h-4 w-3/4 bg-muted rounded-md"></div></CardContent>
                                <CardFooter><div className="h-4 w-1/4 bg-muted rounded-md"></div></CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : audits && audits.length > 0 ? (
                    <div className="space-y-4">
                        {audits.map(audit => (
                            <Card key={audit.id} className="transition-all hover:shadow-lg hover:border-primary">
                                <Link href={`/audit/resultats/${audit.id}`} className="block">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Target className="h-5 w-5 text-primary"/>
                                            Analyse pour profil {audit.platform}
                                        </CardTitle>
                                        <CardDescription>
                                            Objectif : "{audit.goal}"
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="text-xs text-muted-foreground">
                                        Généré le {format(audit.createdAt.toDate(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                    </CardFooter>
                                </Link>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Aucune analyse pour le moment</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Utilisez le Coach Stratégique pour générer votre premier rapport.</p>
                         <Button asChild className="mt-4">
                            <Link href="/audit">Lancer une nouvelle analyse</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
