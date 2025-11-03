
'use client';

import { useState, useEffect, useCallback } from 'react';
import { secretMessages } from '@/lib/secret-messages';

const SEEN_MESSAGES_KEY = 'seenSecretMessages';

// Fonction pour récupérer les messages vus depuis le localStorage
const getSeenMessages = (): number[] => {
    if (typeof window === 'undefined') return [];
    const seen = localStorage.getItem(SEEN_MESSAGES_KEY);
    try {
        return seen ? JSON.parse(seen) : [];
    } catch (error) {
        console.error('Error parsing seen messages from localStorage', error);
        return [];
    }
};

// Hook pour gérer l'état des messages non lus
export const useUnreadMessages = (userLevel: number) => {
    const [hasUnread, setHasUnread] = useState(false);
    
    // Fonction pour vérifier s'il y a des messages non lus
    const checkForUnreadMessages = useCallback(() => {
        const seenMessages = getSeenMessages();
        const unlockedMessages = secretMessages.filter(m => m.level <= userLevel);
        const unreadExists = unlockedMessages.some(m => !seenMessages.includes(m.level));
        setHasUnread(unreadExists);
    }, [userLevel]);

    useEffect(() => {
        checkForUnreadMessages();
        
        // Écouter les changements dans le localStorage depuis d'autres onglets/fenêtres
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === SEEN_MESSAGES_KEY) {
                checkForUnreadMessages();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, [checkForUnreadMessages]);

    // Fonction pour marquer un message comme lu
    const markAsRead = (level: number) => {
        const seenMessages = getSeenMessages();
        if (!seenMessages.includes(level)) {
            const updatedSeenMessages = [...seenMessages, level];
            localStorage.setItem(SEEN_MESSAGES_KEY, JSON.stringify(updatedSeenMessages));
            // Déclencher une vérification pour mettre à jour l'état immédiatement
            checkForUnreadMessages();
            // Dispatch a custom event to notify other components in the same window
            window.dispatchEvent(new CustomEvent('storage-updated'));
        }
    };
    
    // Écouter l'événement personnalisé pour les mises à jour dans la même fenêtre
    useEffect(() => {
        const handleCustomStorageUpdate = () => {
            checkForUnreadMessages();
        };
        window.addEventListener('storage-updated', handleCustomStorageUpdate);
        return () => {
            window.removeEventListener('storage-updated', handleCustomStorageUpdate);
        };
    }, [checkForUnreadMessages]);

    return { hasUnread, markAsRead };
};
