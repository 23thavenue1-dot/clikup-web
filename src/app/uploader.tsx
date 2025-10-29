'use client';

import { useState, useRef, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUrl, MAX_BYTES, ALLOWED_MIME } from '@/lib/storage';
import { saveImageMetadata } from '@/lib/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Copy, Check, Link, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from 'next/image';
import { cn } from '@/lib/utils';

// État pour gérer le processus de téléversement
type UploadStatus =
  | { state: 'idle' } // Attente
  | { state: 'converting'; } // Conversion en Data URL
  | { state: 'saving'; } // Sauvegarde dans Firestore
  | { state: 'success'; url: string; bbCode: string; htmlCode: string } // Terminé
  | { state: 'error'; message: string }; // Erreur


const looksLikeImage = (f: File) =>
  ALLOWED_MIME.test(f.type) || /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)$/i.test(f.name);

export function Uploader() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [status, setStatus] = useState<UploadStatus>({ state: 'idle' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<'url' | 'bb' | 'html' | null>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setSelectedFile(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!looksLikeImage(file)) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Type de fichier non autorisé (images uniquement).' });
        resetFileInput();
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Fichier trop volumineux (> 10 Mo).' });
        resetFileInput();
        return;
      }
      setSelectedFile(file);
      setStatus({ state: 'idle' });
      setCopied(null);
    }
  };
  
  const handleTabChange = () => {
    setStatus({ state: 'idle' });
    resetFileInput();
    setImageUrl('');
    setCopied(null);
  };
  
  // Cette fonction n'est plus utilisée, mais gardée pour référence future
  const [imageUrl, setImageUrl] = useState('');
  const handleUrlUpload = async () => { /* ... */ };

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !user || !firestore) {
      let description = 'Le fichier, l\'utilisateur, ou la configuration Firebase est manquant.';
      if (!selectedFile) description = 'Veuillez sélectionner un fichier à téléverser.';
      if (!user) description = 'Vous devez être connecté pour téléverser un fichier.';
      toast({ variant: 'destructive', title: 'Erreur de pré-téléversement', description });
      return;
    }
    
    setStatus({ state: 'converting' });

    try {
      // Étape 1 : Convertir le fichier en Data URL
      const dataUrl = await fileToDataUrl(selectedFile);
      
      setStatus({ state: 'saving' });

      // Étape 2 : Sauvegarder les métadonnées (y compris la Data URL) dans Firestore
      const bbCode = `[img]${dataUrl}[/img]`;
      const htmlCode = `<img src="${dataUrl}" alt="Image téléversée" />`;
      
      await saveImageMetadata(firestore, user, {
          originalName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          directUrl: dataUrl, // On stocke la Data URL directement
          bbCode,
          htmlCode,
          storagePath: 'data_url', // On indique que ce n'est pas un chemin Storage
      });

      setStatus({ state: 'success', url: dataUrl, bbCode, htmlCode });
      toast({ title: 'Succès', description: 'Votre image a été enregistrée.' });
      resetFileInput();

    } catch (error) {
      const errorMessage = (error as Error).message;
      setStatus({ state: 'error', message: errorMessage });
      toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
      resetFileInput();
    }
  }, [selectedFile, user, firestore, toast]);

  const copyToClipboard = async (text: string, type: 'url' | 'bb' | 'html') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ variant:'destructive', title:'Copie impossible', description:'Autorisez l’accès au presse-papier ou copiez manuellement.' });
    }
  };
  
  const isProcessing = status.state === 'converting' || status.state === 'saving';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une image</CardTitle>
        <CardDescription>
          Le téléversement direct est actuellement en maintenance. Veuillez utiliser la méthode de conversion locale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div 
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isProcessing && fileInputRef.current?.click()}
          aria-disabled={isProcessing}
          className={cn(
            "border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors",
            !isProcessing && 'cursor-pointer hover:bg-muted/50',
            isProcessing && 'pointer-events-none opacity-70'
            )}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isProcessing}
          />
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium text-foreground">
            {selectedFile ? `Fichier sélectionné : ${selectedFile.name}` : 'Cliquez pour choisir un fichier'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fichiers supportés : JPG, PNG, GIF, WEBP (Max 10 Mo)
          </p>
        </div>

        {selectedFile && (
          <div className="space-y-4">
            <Button 
              onClick={handleUpload} 
              disabled={isProcessing} 
              className="w-full"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {status.state === 'converting' ? 'Conversion...' : status.state === 'saving' ? 'Enregistrement...' : 'Démarrer'}
            </Button>
          </div>
        )}
        
        {isProcessing && (
          <div className="space-y-2">
              <Progress value={status.state === 'converting' ? 50 : 100} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {status.state === 'converting' ? 'Conversion du fichier en cours...' : 'Sauvegarde dans la base de données...'}
              </p>
          </div>
        )}
        
        {status.state === 'error' && (
          <p className="text-sm text-destructive">{status.message}</p>
        )}

        {status.state === 'success' && (
          <div className="space-y-3 rounded-md border bg-muted/50 p-4">
            <h4 className="font-medium text-sm">Opération réussie !</h4>

            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              <Image 
                src={status.url} 
                alt="Aperçu de l'image" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain bg-background"
                unoptimized
              />
            </div>

            <div className="flex items-center gap-2">
                <Input readOnly value="Copié dans le presse-papiers !" className="bg-background text-xs truncate italic"/>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(status.url, 'url')}>
                    {copied === 'url' ? <Check className="text-green-500"/> : <Copy />}
                </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
