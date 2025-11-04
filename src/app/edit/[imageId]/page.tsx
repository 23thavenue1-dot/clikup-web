
'use client';

import { useParams } from 'next/navigation';

export default function EditImagePage() {
    const params = useParams();
    const imageId = params.imageId as string;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold">Page d'édition d'image</h1>
            <p className="text-muted-foreground">Bientôt disponible. ID de l'image : {imageId}</p>
        </div>
    );
}
