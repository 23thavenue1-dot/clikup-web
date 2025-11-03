
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveNote, type Note } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotesSection() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [noteText, setNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const notesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/notes`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: notes, isLoading } = useCollection<Note>(notesQuery);

    const handleSaveNote = async () => {
        if (!noteText.trim() || !user || !firestore) return;
        setIsSaving(true);
        try {
            await saveNote(firestore, user, noteText);
            setNoteText('');
            toast({ title: "Note enregistrée", description: "Votre note a été ajoutée avec succès." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'enregistrer la note." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mon Pense-bête</CardTitle>
                <CardDescription>
                    Utilisez cet espace pour noter rapidement des idées, des tâches ou toute autre information.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Textarea
                        placeholder="Écrivez quelque chose..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        disabled={isSaving}
                    />
                     <Button onClick={handleSaveNote} disabled={isSaving || !noteText.trim()}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer la note'}
                    </Button>
                </div>
                <div className="space-y-2 pt-4">
                    <h4 className="font-medium">Vos notes :</h4>
                    {isLoading && (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    {!isLoading && (!notes || notes.length === 0) && (
                        <p className="text-sm text-muted-foreground">Aucune note pour le moment.</p>
                    )}
                    <ul className="space-y-2">
                        {notes?.map((note) => (
                            <li key={note.id} className="p-3 bg-muted/50 rounded-md border text-sm">
                                <p className="whitespace-pre-wrap">{note.text}</p>

                                {note.createdAt && (
                                     <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true, locale: fr })}
                                     </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
