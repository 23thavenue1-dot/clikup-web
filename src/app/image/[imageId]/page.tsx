
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ImageMetadata } from '@/lib/firestore';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, Copy, Check, CopyPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';


export default function ImageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const imageId = params.imageId as string;

    const { user, isUserLoading } = useFirebase();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [copiedField, setCopiedField] = useState<string | null>(null);

    const imageDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/images`, imageId);
    }, [user, firestore, imageId]);

    const { data: image, isLoading: isImageLoading } = useDoc<ImageMetadata>(imageDocRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const copyToClipboard = async (text: string, field: string, toastTitle = "Copié !") => {
        try {
          await navigator.clipboard.writeText(text);
          setCopiedField(field);
          toast({ title: toastTitle });
          setTimeout(() => setCopiedField(null), 2000);
        } catch {
          toast({ variant:'destructive', title:'Copie impossible', description:'Autorisez l’accès au presse-papier ou copiez manuellement.' });
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
                 <p className="text-muted-foreground">L'image que vous essayez de voir n'existe pas ou vous n'y avez pas accès.</p>
                 <Button asChild className="mt-4">
                    <Link href="/">Retour à l'accueil</Link>
                 </Button>
            </div>
        );
    }

    const fullTextToCopy = `${image.title || ''}\n\n${image.description || ''}\n\n${image.hashtags || ''}`.trim();


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                     <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour à la galerie
                        </Link>
                    </Button>
                    <Button
                        onClick={() => copyToClipboard(fullTextToCopy, 'details-all', 'Contenu complet copié !')}
                        disabled={!fullTextToCopy}
                    >
                        {copiedField === 'details-all' ? <Check className="mr-2" /> : <CopyPlus className="mr-2" />}
                        Tout Copier
                    </Button>
                </div>
               
                <Card>
                    <CardHeader>
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted mb-4">
                            <Image
                                src={image.directUrl}
                                alt={image.title || image.originalName || 'Image'}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <CardTitle className="text-3xl break-words">{image.title || 'Sans titre'}</CardTitle>
                        <CardDescription>
                            Téléversée {formatDistanceToNow(image.uploadTimestamp.toDate(), { addSuffix: true, locale: fr })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <Separator/>
                         <div className="space-y-4">
                            <div className="group/copy-item relative">
                                <Label className="text-muted-foreground">Description</Label>
                                <p className="text-base whitespace-pre-wrap pr-8">{image.description || 'Aucune description'}</p>
                                {image.description && (
                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover/copy-item:opacity-100" onClick={() => copyToClipboard(image.description!, 'details-desc', 'Description copiée !')}>
                                        {copiedField === 'details-desc' ? <Check className="text-green-500" /> : <Copy size={16} />}
                                    </Button>
                                )}
                            </div>

                             <div className="group/copy-item relative">
                                <Label className="text-muted-foreground">Hashtags</Label>
                                <p className="text-base text-primary pr-8 break-words">{image.hashtags || 'Aucun hashtag'}</p>
                                {image.hashtags && (
                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover/copy-item:opacity-100" onClick={() => copyToClipboard(image.hashtags!, 'details-tags', 'Hashtags copiés !')}>
                                        {copiedField === 'details-tags' ? <Check className="text-green-500" /> : <Copy size={16} />}
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                         <Separator/>

                        <div className="space-y-4">
                             <div className="group/copy-item relative">
                                <Label className="text-muted-foreground">Lien direct (URL)</Label>
                                <p className="text-sm pr-8 truncate">{image.directUrl}</p>
                                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover/copy-item:opacity-100" onClick={() => copyToClipboard(image.directUrl, 'direct', 'Lien copié !')}>
                                    {copiedField === 'direct' ? <Check className="text-green-500"/> : <Copy size={16} />}
                                </Button>
                            </div>

                             <div className="group/copy-item relative">
                                <Label className="text-muted-foreground">Pour forum (BBCode)</Label>
                                <p className="text-sm pr-8 truncate">{image.bbCode}</p>
                                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover/copy-item:opacity-100" onClick={() => copyToClipboard(image.bbCode, 'bbcode', 'BBCode copié !')}>
                                    {copiedField === 'bbcode' ? <Check className="text-green-500"/> : <Copy size={16} />}
                                </Button>
                            </div>

                             <div className="group/copy-item relative">
                                <Label className="text-muted-foreground">Pour site web (HTML)</Label>
                                <p className="text-sm pr-8 truncate">{image.htmlCode}</p>
                                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover/copy-item:opacity-100" onClick={() => copyToClipboard(image.htmlCode, 'html', 'Code HTML copié !')}>
                                    {copiedField === 'html' ? <Check className="text-green-500"/> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
