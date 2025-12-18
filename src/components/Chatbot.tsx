'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white transform hover:scale-110 transition-transform"
          aria-label="Ouvrir l'assistant IA"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="w-[440px] rounded-t-lg fixed bottom-0 right-6 h-[70vh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary"/>
            Assistant Clikup
          </SheetTitle>
          <SheetDescription>
            Posez une question ou demandez une action.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4">
            <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                    <AvatarFallback>IA</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                    <p className="text-sm">
                        Bonjour ! Comment puis-je vous aider aujourd'hui ?
                        <br/><br/>
                        Vous pouvez me demander, par exemple : "Crée une galerie nommée 'Mes vacances' et ajoute-y l'image la plus récente."
                    </p>
                </div>
            </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t bg-background">
            <div className="flex items-center gap-2 w-full">
                <Textarea
                    placeholder="Votre message..."
                    rows={1}
                    className="flex-1 resize-none"
                    disabled={true} // Désactivé pour la v1
                />
                <Button size="icon" disabled={true}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
