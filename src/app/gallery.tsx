'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ImageGallery() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const imagesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/images`);
    }, [user, firestore]);

    const { data: images, isLoading, error } = useCollection(imagesQuery);

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: "Copié!", description: `${type} a été copié dans le presse-papiers.` });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur", description: "La copie a échoué." });
        }
    };


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ma galerie</CardTitle>
                    <CardDescription>Vos images téléversées.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="aspect-square w-full rounded-md" />
                             <Skeleton className="h-4 w-3/4" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                    Impossible de charger votre galerie d'images.
                </AlertDescription>
            </Alert>
        )
    }

    if (!images || images.length === 0) {
        return (
            <Card className="text-center">
                 <CardHeader>
                    <CardTitle>Ma galerie</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Vous n'avez pas encore téléversé d'images.</p>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Ma galerie</CardTitle>
                <CardDescription>Vos images récemment téléversées.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-lg border">
                             <Image
                                src={image.downloadURL}
                                alt={image.name}
                                width={300}
                                height={300}
                                className="aspect-square object-cover w-full transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-semibold truncate">{image.name}</p>
                                <div className="flex gap-1 mt-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 hover:text-white" onClick={() => copyToClipboard(image.downloadURL, "L'URL directe")}><Copy className="w-4 h-4"/></Button>
                                      <a href={image.downloadURL} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"><ExternalLink className="w-4 h-4"/></Button>
                                      </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
