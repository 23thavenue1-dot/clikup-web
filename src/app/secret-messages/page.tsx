
'use client';

import { secretMessages } from '@/lib/secret-messages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Lock, Trophy } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

// A little type trick to allow dynamic icon names
type IconName = keyof typeof LucideIcons;

const getIcon = (name: string): React.FC<LucideIcons.LucideProps> => {
  const Icon = LucideIcons[name as IconName];
  return Icon || LucideIcons.HelpCircle;
};

export default function SecretMessagesPage() {
    // Pour le moment, on simule un utilisateur de niveau 1.
    // Plus tard, vous remplacerez `1` par la vraie valeur dynamique.
    const unlockedLevel = 1;
    const { markAsRead } = useUnreadMessages(unlockedLevel);

    const handleAccordionChange = (value: string) => {
        if (value) {
            const level = parseInt(value.replace('item-', ''), 10);
            markAsRead(level);
        }
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Messages Secrets</h1>
                    <p className="text-muted-foreground mt-2">
                        Chaque niveau atteint révèle un nouveau secret sur l'art de la photographie et de la création.
                    </p>
                </header>

                <Accordion type="single" collapsible onValueChange={handleAccordionChange} className="w-full space-y-2">
                    {secretMessages.map((message) => {
                        const isUnlocked = message.level <= unlockedLevel;
                        const Icon = getIcon(message.icon);

                        return (
                            <AccordionItem key={message.level} value={`item-${message.level}`} className={`border rounded-lg transition-opacity ${isUnlocked ? 'opacity-100 bg-card' : 'opacity-50'}`}>
                                <AccordionTrigger className="p-4 hover:no-underline" disabled={!isUnlocked}>
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold">Niveau {message.level}: {message.title}</h3>
                                            <p className="text-sm text-muted-foreground">Débloqué au niveau {message.level}.</p>
                                        </div>
                                        {isUnlocked ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 mr-4" />
                                        ) : (
                                            <Lock className="h-5 w-5 text-muted-foreground mr-4" />
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                     <p className="pl-16">
                                        {message.content}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
