# Feuille de Route de "Clikup"

Ce document trace les grandes lignes des fonctionnalités que nous prévoyons de construire, en commençant par les plus fondamentales.

## 1. Sécurité et Contrôle des Coûts via un Système de Tickets (Priorité)

### Le Principe
L'objectif est de prévenir les abus et de maîtriser les coûts de stockage Firebase. Au lieu d'une simple limite, nous allons implémenter un système de "tickets" pour rendre l'expérience plus engageante.

### Comment ça marche ?
- **Règle de base :** 1 téléversement = 1 ticket consommé.
- **Distribution quotidienne :** Chaque utilisateur reçoit **5 tickets** chaque jour.
- **Réinitialisation :** Le stock de tickets est rechargé à 5 au début d'une nouvelle journée (basé sur un fuseau horaire ou 24h après la première connexion du jour).
- **Plafond :** Un utilisateur ne peut **jamais accumuler plus de 5 tickets**. Si un utilisateur a 3 tickets restants à la fin de la journée, son stock sera simplement re-complété à 5 le lendemain, il n'aura pas 3 + 5 = 8 tickets.

### Avantages de cette approche
1.  **Sécurité :** Empêche un utilisateur unique de téléverser des centaines d'images en peu de temps.
2.  **Contrôle des coûts :** Nous maîtrisons le nombre maximal d'uploads quotidiens sur toute la plateforme.
3.  **Expérience utilisateur :** Le concept de "tickets" est plus ludique et moins frustrant qu'un simple message d'erreur "limite atteinte".
4.  **Fondation pour le futur :** Ce système est une base parfaite pour des évolutions :
    - **Monétisation :** On pourra vendre des packs de tickets supplémentaires.
    - **Récompenses :** On pourra offrir des tickets pour des actions spécifiques (parrainer un ami, se connecter 7 jours d'affilée, etc.).

### Implémentation technique
- **Côté Firestore :** Nous devrons ajouter deux champs au document de chaque utilisateur :
    - `ticketCount` (nombre de tickets restants).
    - `lastTicketRefill` (timestamp de la dernière recharge).
- **Côté Application :** La logique de vérification et de décompte se fera avant chaque téléversement.
- **Côté Sécurité :** Les règles de sécurité Firestore seront modifiées pour interdire l'écriture si `ticketCount` est à 0.

## 2. Intégration de l'IA (Prochaines étapes)

Une fois la sécurité assurée, nous pourrons explorer les idées passionnantes listées dans `docs/idées.md` :
- Titres et descriptions automatiques pour les images.
- Taggage et catégorisation intelligents.
- "Critique" de la photo par l'IA.
- Édition d'image par le langage.
