
'use client';

import { useState, useRef, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUrl, uploadFileAndGetMetadata } from '@/lib/storage';
import { saveImageMetadata, saveImageFromUrl } from '@/lib/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Link as LinkIcon, Loader2, HardDriveUpload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


type UploadStatus =
  | { state: 'idle' }
  | { state: 'processing' }
  | { state: 'uploading'; progress: number }
  | { state: 'success'; url: string; }
  | { state: 'error'; message: string };

const looksLikeImage = (f: File) =>
  /^(image\/.*)$/i.test(f.type) || /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)$/i.test(f.name);


export function Uploader() {
  const { user, firestore, storage } = useFirebase();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<UploadStatus>({ state: 'idle' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [imageUrl, setImageUrl] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus({ state: 'idle' });
    setSelectedFile(null);
    setCustomName('');
    setImageUrl('');
    setIsProcessing(false);
    setIsUrlLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleTabChange = (value: string) => {
    resetState();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!looksLikeImage(file)) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Type de fichier non autorisé (images uniquement).' });
            return;
        }
        setSelectedFile(file);
        setStatus({ state: 'idle' });
    }
  };

  const handleDataUrlUpload = useCallback(async () => {
    if (!selectedFile || !user || !firestore) return;

    setIsProcessing(true);
    setStatus({ state: 'processing' });

    try {
        const dataUrl = await fileToDataUrl(selectedFile);
        
        await saveImageMetadata(firestore, user, {
            originalName: customName || selectedFile.name,
            directUrl: dataUrl,
            bbCode: `[img]${dataUrl}[/img]`,
            htmlCode: `<img src="${dataUrl}" alt="${customName || selectedFile.name}" />`,
            mimeType: selectedFile.type,
            fileSize: selectedFile.size,
            storagePath: 'data_url', // Marqueur pour indiquer que ce n'est pas sur Storage
        });

        toast({ title: 'Succès', description: 'Votre image a été enregistrée via la méthode Data URL.' });
        resetState();

    } catch (error) {
        const errorMessage = (error as Error).message;
        setStatus({ state: 'error', message: `Erreur: ${errorMessage}` });
        toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
    } finally {
        setIsProcessing(false);
    }
  }, [selectedFile, customName, user, firestore, toast]);

  const handleStorageUpload = useCallback(async () => {
    if (!selectedFile || !user || !storage || !firestore) return;

    setIsProcessing(true);
    try {
      const metadata = await uploadFileAndGetMetadata(
        storage,
        user,
        selectedFile,
        customName,
        (progress) => setStatus({ state: 'uploading', progress })
      );

      await saveImageMetadata(firestore, user, metadata);
      
      toast({ title: "Téléversement réussi !", description: "Votre image a été envoyée sur Firebase Storage." });
      resetState();

    } catch (error) {
        const errorMessage = (error as Error).message;
        setStatus({ state: 'error', message: `Erreur: ${errorMessage}` });
        toast({ variant: 'destructive', title: 'Erreur de téléversement', description: errorMessage });
        setIsProcessing(false); // S'assurer de réactiver le bouton en cas d'erreur
    }
  }, [selectedFile, customName, user, storage, firestore, toast]);

  const handleUrlUpload = async () => {
    if (!imageUrl.trim() || !user || !firestore) return;
    setIsUrlLoading(true);

    try {
        await saveImageFromUrl(firestore, user, {
            directUrl: imageUrl,
            bbCode: `[img]${imageUrl}[/img]`,
            htmlCode: `<img src="${imageUrl}" alt="Image depuis URL" />`,
        });

        toast({ title: 'Succès', description: 'Image depuis URL ajoutée.' });
        resetState();
        
    } catch (error) {
        const errorMessage = (error as Error).message;
        setStatus({ state: 'error', message: errorMessage });
        toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
    } finally {
        setIsUrlLoading(false);
    }
  };

  const renderFilePicker = (isForStorage: boolean) => (
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
          {isForStorage ? "Tentative d'envoi direct vers le cloud." : "Contournement via Data URL."}
        </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une image</CardTitle>
        <CardDescription>
          Choisissez votre méthode de téléversement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="data-url" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data-url"><UploadCloud className="mr-2 h-4 w-4"/>Via Fichier (sécurisé)</TabsTrigger>
            <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4"/>Via URL</TabsTrigger>
            <TabsTrigger value="storage"><HardDriveUpload className="mr-2 h-4 w-4" />Via Storage (Test)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data-url" className="space-y-4 pt-4">
            {renderFilePicker(false)}
            {selectedFile && (
                <div className="space-y-4">
                    <Input
                    placeholder="Nom personnalisé (optionnel)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={isProcessing}
                    />
                    <Button 
                    onClick={handleDataUrlUpload} 
                    disabled={isProcessing || !selectedFile} 
                    className="w-full"
                    >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isProcessing ? 'Traitement...' : 'Téléverser'}
                    </Button>
                </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4 pt-4">
            <Input
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isUrlLoading}
            />
            <Button onClick={handleUrlUpload} disabled={isUrlLoading || !imageUrl.trim()} className="w-full">
                {isUrlLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ajouter depuis l'URL
            </Button>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4 pt-4">
            {renderFilePicker(true)}
            {status.state === 'uploading' && <Progress value={status.progress} className="w-full" />}

            {selectedFile && (
                <div className="space-y-4">
                    <Input
                    placeholder="Nom personnalisé (optionnel)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={isProcessing}
                    />
                    <Button 
                    onClick={handleStorageUpload} 
                    disabled={isProcessing || !selectedFile} 
                    className="w-full"
                    >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isProcessing ? 'Envoi...' : 'Téléverser sur Storage'}
                    </Button>
                </div>
            )}
          </TabsContent>

        </Tabs>
        
        {status.state === 'error' && (
          <p className="mt-4 text-sm text-center text-destructive">{status.message}</p>
        )}

      </CardContent>
    </Card>
  );
}
