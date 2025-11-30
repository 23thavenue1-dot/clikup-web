'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { AppError } from '@/firebase/errors';
import { toast } from 'sonner';

export function useErrorNotification() {
  useEffect(() => {
    const handleError = (error: AppError) => {
      toast.error(error.userMessage, {
        description: process.env.NODE_ENV === 'development' 
          ? error.technicalMessage 
          : undefined,
        action: error.isRetryable ? {
          label: 'Réessayer',
          onClick: () => {
            // La logique de retry spécifique doit être implémentée là où l'action est déclenchée.
            // Ce bouton sert principalement d'indicateur visuel.
            // On pourrait par exemple émettre un autre événement ici pour déclencher un retry.
          }
        } : undefined,
      });
    };

    errorEmitter.on('error', handleError);

    return () => {
      errorEmitter.off('error', handleError);
    };
  }, []);
}