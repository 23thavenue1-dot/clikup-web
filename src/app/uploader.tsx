
'use client';

import { useState, useRef, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/storage';
import { saveImageMetadata } from '@/lib/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Copy, Check } from 'lucide-react';

// État pour gérer le processus de téléversement
type UploadStatus = 
  | { state: 'idle' } // Attente
  | { state: 'uploading'; progress: number } // En cours
  | { state: 'success'; url: string; bbCode: string; htmlCode: string } // Terminé
  | { state: 'error'; message: string }; // Erreur

export function Uploader() {
  const { user, storage, firestore } = useFirebase();
  const { toast } = useToast();
  const [status, setStatus] = useState<UploadStatus>({ state: 'idle' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<'url' | 'bb' | 'html' | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStatus({ state: 'idle' });
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !user || !storage || !firestore) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Fichier ou utilisateur manquant.' });
      return;
    }
    
    setStatus({ state: 'uploading', progress: 0 });

    uploadImage(
      storage,
      user,
      selectedFile,
      customName,
      (progress) => setStatus({ state: 'uploading', progress }),
      (error) => {
        setStatus({ state: 'error', message: "Le téléversement a échoué. Vérifiez les règles de sécurité de Storage." });
        toast({ variant: 'destructive', title: 'Erreur de téléversement', description: error.message });
      },
      async (directUrl, storagePath) => {
        try {
          const bbCode = `[img]${directUrl}[/img]`;
          const htmlCode = `<img src="${directUrl}" alt="Image téléversée" />`;

          await saveImageMetadata(firestore, user, {
            originalName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
            storagePath,
            directUrl,
            bbCode,
            htmlCode,
          });

          setStatus({ state: 'success', url: directUrl, bbCode, htmlCode });
          toast({ title: 'Succès', description: 'Votre image a été téléversée et enregistrée.' });
          setSelectedFile(null);
          setCustomName('');
        } catch (error) {
          setStatus({ state: 'error', message: "L'enregistrement dans Firestore a échoué. Vérifiez les règles de sécurité de Firestore." });
          toast({ variant: 'destructive', title: "Erreur d'enregistrement", description: (error as Error).message });
        }
      }
    );
  }, [selectedFile, customName, user, storage, firestore, toast]);

  const copyToClipboard = (text: string, type: 'url' | 'bb' | 'html') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Téléverser une image</CardTitle>
        <CardDescription>
          Sélectionnez un fichier depuis votre ordinateur pour le téléverser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
          />
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {selectedFile ? `Fichier sélectionné : ${selectedFile.name}` : 'Glissez-déposez ou cliquez pour choisir un fichier'}
          </p>
        </div>

        {selectedFile && (
          <div className="space-y-4">
             <Input
                type="text"
                placeholder="Nom personnalisé (optionnel)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            <Button 
              onClick={handleUpload} 
              disabled={status.state === 'uploading'} 
              className="w-full"
            >
              {status.state === 'uploading' ? 'Téléversement en cours...' : 'Démarrer le téléversement'}
            </Button>
          </div>
        )}

        {status.state === 'uploading' && <Progress value={status.progress} />}
        
        {status.state === 'error' && (
          <p className="text-sm text-destructive">{status.message}</p>
        )}

        {status.state === 'success' && (
          <div className="space-y-3 rounded-md border bg-muted/50 p-4">
            <h4 className="font-medium text-sm">Téléversement réussi !</h4>
            <div className="flex items-center gap-2">
                <Input readOnly value={status.url} className="bg-background"/>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(status.url, 'url')}>
                    {copied === 'url' ? <Check className="text-green-500"/> : <Copy />}
                </Button>
            </div>
             <div className="flex items-center gap-2">
                <Input readOnly value={status.bbCode} className="bg-background"/>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(status.bbCode, 'bb')}>
                    {copied === 'bb' ? <Check className="text-green-500"/> : <Copy />}
                </Button>
            </div>
             <div className="flex items-center gap-2">
                <Input readOnly value={status.htmlCode} className="bg-background"/>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(status.htmlCode, 'html')}>
                    {copied === 'html' ? <Check className="text-green-500"/> : <Copy />}
                </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
