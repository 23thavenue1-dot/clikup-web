
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function AuditPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const [platform, setPlatform] = useState('');
    const [goal, setGoal] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const canProceed = platform && goal;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Coach Stratégique AI</h1>
                    <p className="text-muted-foreground mt-2">
                        Recevez une analyse complète et un plan d'action personnalisé pour votre profil de réseau social.
                    </p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Étape 1 : Le Contexte</CardTitle>
                        <CardDescription>
                            Dites-nous quel profil analyser et quel est votre objectif principal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="platform">Plateforme du réseau social</Label>
                            <Select value={platform} onValueChange={setPlatform}>
                                <SelectTrigger id="platform" className="w-full">
                                    <SelectValue placeholder="Choisissez une plateforme..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="x">X (Twitter)</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="other">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goal">Quel est votre objectif principal ?</Label>
                            <Select value={goal} onValueChange={setGoal}>
                                <SelectTrigger id="goal" className="w-full">
                                    <SelectValue placeholder="Choisissez un objectif..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="engagement">Augmenter mon engagement et créer une communauté.</SelectItem>
                                    <SelectItem value="branding">Professionnaliser mon image de marque.</SelectItem>
                                    <SelectItem value="clients">Trouver plus de clients ou d'opportunités.</SelectItem>
                                    <SelectItem value="identity">Définir une identité visuelle plus cohérente.</SelectItem>
                                    <SelectItem value="diversify">Diversifier mon contenu et trouver de nouvelles idées.</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button disabled={!canProceed || isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Étape suivante
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
