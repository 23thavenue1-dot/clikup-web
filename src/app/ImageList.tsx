
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ImageMetadata, deleteImageMetadata } from '@/lib/firestore';
import { deleteImageFile } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


export function ImageList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<ImageMetadata | null>(null);


    const imagesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/images`), orderBy('uploadTimestamp', 'desc'));
    }, [user, firestore]);

    const { data: images, isLoading } = useCollection<ImageMetadata>(imagesQuery);
    
    const openDeleteDialog = (image: ImageMetadata) => {
        setImageToDelete(image);
        setShowDeleteAlert(true);
    };

    const handleDeleteImage = async () => {
        if (!imageToDelete || !user || !storage || !firestore) return;
        
        setIsDeleting(imageToDelete.id);

        try {
            // Supprimer d'abord le fichier de Storage (si applicable)
            await deleteImageFile(storage, imageToDelete.storagePath);
            // Ensuite, supprimer les métadonnées de Firestore
            await deleteImageMetadata(firestore, user.uid, imageToDelete.id);

            toast({ title: "Image supprimée", description: "L'image a été supprimée avec succès." });

        } catch (error) {
            console.error("Erreur lors de la suppression de l'image:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Une erreur est survenue lors de la suppression de l'image."
            });
        } finally {
            setIsDeleting(null);
            setShowDeleteAlert(false);
            setImageToDelete(null);
        }
    };


    const renderSkeleton = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Mes images</CardTitle>
                    <CardDescription>
                        Voici la liste de vos images téléversées ou ajoutées par URL.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && renderSkeleton()}

                    {!isLoading && (!images || images.length === 0) && (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <ImageIcon className="h-12 w-12 mb-4" />
                            <p className="font-medium">Aucune image pour le moment.</p>
                            <p className="text-sm">Utilisez le module ci-dessus pour en ajouter une.</p>
                        </div>
                    )}
                    
                    {!isLoading && images && images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map(image => (
                                <div key={image.id} className="group relative aspect-square w-full overflow-hidden rounded-lg border">
                                    <Image
                                        src={image.directUrl}
                                        alt={image.originalName || 'Image téléversée'}
                                        layout="fill"
                                        objectFit="cover"
                                        className="bg-muted transition-transform group-hover:scale-105"
                                        unoptimized // Important pour les URL externes et celles de Storage
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                    <div className="absolute top-2 right-2 z-10">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openDeleteDialog(image)}
                                            disabled={isDeleting === image.id}
                                            aria-label="Supprimer l'image"
                                        >
                                            {isDeleting === image.id ? <Loader2 className="animate-spin" /> : <Trash2 size={16}/>}
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                        <p 
                                        className="text-sm font-semibold truncate"
                                        title={image.originalName}
                                        >
                                            {image.originalName || 'Image depuis URL'}
                                        </p>
                                        {image.uploadTimestamp && (
                                            <p className="text-xs opacity-80">
                                                {formatDistanceToNow(image.uploadTimestamp.toDate(), { addSuffix: true, locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. L'image sera définitivement supprimée de votre galerie et de l'espace de stockage.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteImage}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
