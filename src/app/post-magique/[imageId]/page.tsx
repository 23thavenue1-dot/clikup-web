
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ImageMetadata, UserProfile } from '@/lib/firestore';
import { Loader2, ArrowLeft, Instagram, Facebook, Clapperboard, Layers, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateCarousel } from '@/ai/flows/generate-carousel-flow';
import type { CarouselSlide } from '@/ai/schemas/carousel-schemas';
import { decrementAiTicketCount } from '@/lib/firestore';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from '@/components/ui/separator';

const ActionCard = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
    <div
        className={cn(
            "group relative p-4 border rounded-xl h-full flex flex-col items-start gap-2",
            "transition-all duration-300 ease-out cursor-pointer overflow-hidden transform hover:scale-[1.03]",
            "hover:shadow-2xl hover:shadow-purple-500/40",
            "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500 text-white",
            className
        )}
        {...props}
    >
        <div className="relative z-10 w-full h-full flex flex-col items-start gap-2">
            {children}
        </div>
    </div>
);

const ActionIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
    <div className="p-2 bg-white/10 border border-white/20 text-white rounded-xl shadow-lg transition-all duration-300 group-hover:bg-white/20">
        <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
    </div>
);

const ActionTitle = ({ children }: { children: React.ReactNode }) => (
    <span className="font-semibold text-sm text-white">{children}</span>
);

const ActionDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs text-white/80 transition-colors group-hover:text-white">{children}</p>
);

const SocialIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
    <div className="p-1 bg-black/20 border border-white/30 text-white rounded-full shadow-md absolute top-3 right-3">
        <Icon className="h-4 w-4" />
    </div>
);


export default function PostMagiquePage() {
    const params = useParams();
    const router = useRouter();
    const imageId = params.imageId as string;

    const { user, isUserLoading } = useFirebase();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSlides, setGeneratedSlides] = useState<CarouselSlide[] | null>(null);

    const imageDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/images`, imageId);
    }, [user, firestore, imageId]);
    const { data: image, isLoading: isImageLoading } = useDoc<ImageMetadata>(imageDocRef);

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    const { data: userProfile, refetch: refetchUserProfile } = useDoc<UserProfile>(userDocRef);


    const handleGenerate = async (format: string, network: string) => {
        if (!image || !user || !userProfile || !firestore) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lancer la génération.' });
            return;
        }

        const CAROUSEL_COST = 3;
        if ((userProfile.aiTicketCount + userProfile.packAiTickets + userProfile.subscriptionAiTickets) < CAROUSEL_COST) {
             toast({ variant: 'destructive', title: 'Tickets IA insuffisants', description: `La génération d'un carrousel requiert ${CAROUSEL_COST} tickets.` });
            return;
        }

        setIsGenerating(true);
        setGeneratedSlides(null);

        try {
            const result = await generateCarousel({
                baseImageUrl: image.directUrl,
                platform: network.toLowerCase(),
            });
            setGeneratedSlides(result.slides);

            for (let i = 0; i < CAROUSEL_COST; i++) {
                await decrementAiTicketCount(firestore, user.uid, userProfile, 'edit');
            }
            refetchUserProfile();

            toast({ title: 'Carrousel généré !', description: 'Votre contenu est prêt.' });

        } catch (error) {
            console.error("Erreur de génération de carrousel:", error);
            toast({ variant: 'destructive', title: 'Erreur de l\'IA', description: 'Impossible de générer le carrousel. Veuillez réessayer.' });
        } finally {
            setIsGenerating(false);
        }
    };


    if (isUserLoading || isImageLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!image) {
        return (
            <div className="container mx-auto p-8 text-center">
                 <h1 className="text-2xl font-bold">Image introuvable</h1>
                 <p className="text-muted-foreground">L'image source pour le Post Magique n'a pas été trouvée.</p>
                 <Button asChild className="mt-4">
                    <Link href="/">Retour à l'accueil</Link>
                 </Button>
            </div>
        );
    }
    
    const formats = [
        { network: 'Instagram', format: 'Publication', icon: Instagram, typeIcon: ImageIcon, disabled: true },
        { network: 'Instagram', format: 'Story', icon: Instagram, typeIcon: Clapperboard, disabled: true },
        { network: 'Instagram', format: 'Carrousel', icon: Instagram, typeIcon: Layers, disabled: false },
        { network: 'Facebook', format: 'Publication', icon: Facebook, typeIcon: ImageIcon, disabled: true },
    ];


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <header className="space-y-2">
                     <Button variant="ghost" asChild className="mb-4 -ml-4">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour à l'accueil
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight">Post Magique 🪄</h1>
                    <p className="text-muted-foreground">
                        Choisissez un format. L'IA s'occupe de transformer votre image en un contenu optimisé prêt à publier.
                    </p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Image d'Origine</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-md border bg-muted mb-4">
                            <Image
                                src={image.directUrl}
                                alt={image.title || image.originalName || 'Image d\'origine'}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    </CardContent>
                </Card>
                
                {isGenerating && (
                    <Card className="text-center">
                        <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                            <p className="font-semibold">L'IA prépare votre contenu...</p>
                            <p className="text-sm text-muted-foreground">Cette opération peut prendre jusqu'à une minute.</p>
                        </CardContent>
                    </Card>
                )}

                {generatedSlides && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Votre Carrousel est Prêt !</CardTitle>
                            <CardDescription>Faites défiler pour voir le résultat.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Carousel className="w-full max-w-xl mx-auto">
                                <CarouselContent>
                                    {generatedSlides.map((slide, index) => (
                                    <CarouselItem key={index}>
                                        <Card className="overflow-hidden">
                                            <CardHeader className="bg-muted p-2">
                                                <CardTitle className="text-center text-sm font-semibold uppercase tracking-widest">{slide.title}</CardTitle>
                                            </CardHeader>
                                            {slide.type === 'image' ? (
                                                <div className="aspect-square relative bg-black">
                                                     <Image src={slide.content} alt={slide.title} fill className="object-contain" unoptimized/>
                                                </div>
                                            ) : (
                                                <div className="aspect-square flex items-center justify-center p-8 bg-background">
                                                    <p className="text-lg text-center font-medium whitespace-pre-wrap">{slide.content}</p>
                                                </div>
                                            )}
                                        </Card>
                                    </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="-left-4 md:-left-12" />
                                <CarouselNext className="-right-4 md:-right-12" />
                            </Carousel>
                            <div className="text-center mt-6">
                                <Button onClick={() => setGeneratedSlides(null)}>
                                    <Sparkles className="mr-2 h-4 w-4"/>
                                    Créer une autre transformation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!isGenerating && !generatedSlides && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Choisissez une transformation</CardTitle>
                            <CardDescription>Cliquez sur un format pour lancer la magie.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {formats.map((fmt, index) => (
                                <AlertDialog key={index}>
                                    <AlertDialogTrigger asChild disabled={fmt.disabled}>
                                        <ActionCard className={cn(fmt.disabled && "opacity-50 cursor-not-allowed")}>
                                            <SocialIcon icon={fmt.icon} />
                                            <ActionIcon icon={fmt.typeIcon} />
                                            <ActionTitle>{fmt.format}</ActionTitle>
                                            <ActionDescription>pour {fmt.network}</ActionDescription>
                                        </ActionCard>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmer la génération ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action utilisera 3 tickets IA pour générer un carrousel complet. Êtes-vous sûr de vouloir continuer ?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleGenerate(fmt.format, fmt.network)}>Valider & Générer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ))}
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
