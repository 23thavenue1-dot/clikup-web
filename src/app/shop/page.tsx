
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Gem, Rocket, Sparkles, Upload, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';


const subscriptions = [
    {
        id: 'price_1SSLhUFxufdYfSFcWj79b8rt',
        title: 'Pro',
        price: '9,99 €',
        period: '/ mois',
        description: 'Pour le créateur de contenu sérieux, freelance ou community manager.',
        features: [
            'Tickets d\'upload illimités',
            '150 tickets IA par mois',
            '100 Go de stockage',
            'Accès en avant-première aux nouvelles fonctionnalités',
        ],
        icon: Gem,
        featured: true,
        mode: 'subscription',
    },
     {
        id: 'price_1SQ8qMCL0iCpjJiiuReYJAG8',
        title: 'Créateur',
        price: '4,99 €',
        period: '/ mois',
        description: 'L\'idéal pour l\'amateur éclairé qui a besoin de plus de flexibilité.',
        features: [
            '500 tickets d\'upload par mois',
            '50 tickets IA par mois',
            '20 Go de stockage',
            'Badge "Créateur" sur le profil',
        ],
        icon: Rocket,
        mode: 'subscription',
    },
    {
        id: 'price_1SQ8uUCL0iCpjJii5P1ZiYMa',
        title: 'Maître',
        price: '19,99 €',
        period: '/ mois',
        description: 'Pour les agences et les utilisateurs très intensifs ("power users").',
        features