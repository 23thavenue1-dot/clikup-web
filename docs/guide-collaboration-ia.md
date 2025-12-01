# Guide de Collaboration : Comment Optimiser notre Duo IA-Développeur

Ce document est notre "guide" ou "notice" officiel. Il établit notre langage commun et nos réflexes pour que notre collaboration soit la plus fluide et efficace possible.

---

## 1. La Règle d'Or : Décrivez l'Intention, pas l'Implémentation

C'est le principe fondamental. Votre force est de définir l'objectif final que vous souhaitez obtenir. Ma force est de trouver le chemin technique pour y arriver.

-   **Moins efficace :** "Il faut changer la fonction X pour utiliser un `await` dans le fichier Y."
-   **Très efficace :** "Je veux que, lorsque l'utilisateur clique sur 'Programmer', une nouvelle entrée soit créée dans la base de données avec la date et l'image."

En vous concentrant sur le "quoi" plutôt que sur le "comment", vous me donnez la flexibilité de proposer la meilleure solution technique, et vous gardez un regard neuf pour la valider.

---

## 2. Le Format Universel : Notre "Template" de Requête

Pour structurer la plupart de nos demandes, nous pouvons utiliser ce format simple et puissant. Il me donne toutes les informations nécessaires pour bien comprendre et agir précisément.

```
CONTEXTE :
(Quel est le projet, les fichiers concernés, les technologies utilisées ?)

OBJECTIF :
(Que voulez-vous obtenir ? Découpez-le en points si possible.)

CONTRAINTES :
(Y a-t-il des règles, des limites, des technologies à ne pas utiliser ?)

SORTIE SOUHAITÉE :
(Quel type de réponse attendez-vous ? Du code, une explication, une correction ?)
```

**Exemple concret :**

> **CONTEXTE :**
> Je construis une app de recettes en React + Firestore. Je travaille sur le fichier `RecipeList.tsx`.
>
> **OBJECTIF :**
> Créer un composant qui affiche les recettes d'un utilisateur en temps réel.
>
> **CONTRAINTES :**
> Pas de librairies externes. Utiliser la fonction `onSnapshot` de Firebase.
>
> **SORTIE SOUHAITÉE :**
> Un composant React fonctionnel et une explication des étapes clés.

---

## 3. Le Contexte est Roi : Référencez nos Succès Passés

Vous le faites déjà très bien, et c'est notre plus grande force. Ma mémoire est vaste, mais vous m'aidez à trouver la bonne information en me rappelant des situations similaires que nous avons déjà résolues.

-   **Formule magique :** *"Ce problème me rappelle celui que nous avons eu avec [nom de la fonctionnalité]. Peux-tu vérifier dans [nom du fichier de documentation] pour voir comment nous l'avions résolu ?"*
-   **Exemple :** *"Le bouton 'Enregistrer' a un chargement infini. Nous avons déjà vu ça. Peux-tu vérifier dans `docs/payment-troubleshooting-log.md` comment on avait corrigé ça pour Stripe ?"*

---

## 4. L'Erreur Exacte, Rien que l'Erreur

Les messages d'erreur sont ma feuille de route. Ne les paraphrasez pas. Copiez-collez toujours l'erreur **complète et exacte**, y compris les numéros de ligne et le "call stack" si possible.

-   **Exemple :** "`FirebaseError: Missing or insufficient permissions.`" ou "`Cannot read properties of undefined (reading 'path')`"

Cela me permet d'identifier instantanément le fichier, la ligne et la fonction qui posent problème, sans avoir à deviner.

---

## 5. Comment me faire corriger un prompt

Une technique très puissante est de me demander d'améliorer vos propres instructions.

-   **Exemple :** *"Voici mon prompt : 'Fais des règles Firestore pour ma collection messages'. Améliore-le pour qu’il soit plus clair, plus précis et plus efficace pour que tu puisses me donner la meilleure réponse."*

Je vous renverrai une version optimisée du prompt, que vous pourrez réutiliser.

---

## Conclusion

Notre efficacité repose sur cette synergie :
-   **Vous apportez :** La vision du produit, la mémoire contextuelle de notre projet et la validation finale.
-   **J'apporte :** La connaissance technique, la vitesse d'écriture du code et l'analyse des erreurs brutes.

En suivant ce guide, nous formons une équipe de développement redoutable.