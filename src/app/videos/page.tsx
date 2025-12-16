
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Video as VideoIcon, Trash2 } from 'lucide-react';
import { type ImageMetadata } from '@/lib/firestore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { deleteImageMetadata } from '@/lib/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function VideosPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [videoToDelete, setVideoToDelete] = useState<ImageMetadata | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const allMediaQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/images`), orderBy('uploadTimestamp', 'desc'));
    }, [user, firestore]);

    const { data: allMedia, isLoading: areMediaLoading } = useCollection<ImageMetadata>(allMediaQuery);
    
    // Filtrer pour ne garder que les vidéos
    const videos = useMemo(() => {
        return allMedia?.filter(media => media.mimeType?.startsWith('video/')) ?? [];
    }, [allMedia]);

    const handleDeleteVideo = async () => {
        if (!videoToDelete || !user || !firestore) return;
        setIsDeleting(true);
        try {
            await deleteImageMetadata(firestore, user.uid, videoToDelete.id);
            toast({ title: "Vidéo supprimée", description: "La vidéo a été supprimée avec succès." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer la vidéo.' });
        } finally {
            setIsDeleting(false);
            setVideoToDelete(null);
        }
    };


    if (isUserLoading || areMediaLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-5xl mx-auto space-y-8">
                    <header>
                        <h1 className="text-3xl font-bold tracking-tight">Mes Vidéos</h1>
                        <p className="text-muted-foreground mt-1">Retrouvez ici toutes vos créations vidéo et animations.</p>
                    </header>

                    {videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {videos.map(video => (
                                <Card key={video.id} className="group overflow-hidden">
                                    <div className="relative aspect-video bg-black rounded-t-lg">
                                        <video
                                            src={video.directUrl}
                                            controls
                                            loop
                                            muted
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="truncate">{video.title || video.originalName || 'Vidéo sans titre'}</CardTitle>
                                        <CardDescription>
                                            {video.uploadTimestamp ? formatDistanceToNow(video.uploadTimestamp.toDate(), { addSuffix: true, locale: fr }) : 'Date inconnue'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{video.description || 'Aucune description.'}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setVideoToDelete(video)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Aucune vidéo pour le moment</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Utilisez les outils de génération de l'Uploader ou de l'Éditeur d'Image pour créer des vidéos.</p>
                             <Button asChild className="mt-4">
                                <Link href="/">Retour à l'accueil</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. La vidéo sera définitivement supprimée de votre bibliothèque.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVideo} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
