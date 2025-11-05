
'use client';

export type SecretMessage = {
  level: number;
  title: string;
  content: string;
  icon: string; 
};

export const secretMessages: SecretMessage[] = [
  {
    level: 1,
    title: "Le Point de Vue de Nicéphore Niépce",
    content: "Fait historique : En 1826, la première photo, 'Point de vue du Gras', a nécessité plus de 8h de pose. Aujourd'hui, vous capturez un instant en 1/4000s. Chaque cliché est un luxe que Niépce n'aurait jamais imaginé. Utilisez ce pouvoir à bon escient.",
    icon: "Camera",
  },
  {
    level: 2,
    title: "La Règle des Tiers, votre meilleur allié",
    content: "Tips photo : Imaginez un morpion sur votre écran. Placez les éléments forts de votre image (un regard, un arbre) sur les lignes ou à leurs intersections. C'est la façon la plus simple de créer une image équilibrée et professionnelle.",
    icon: "Grid",
  },
  {
    level: 3,
    title: "L'Âge d'Or de la 'Golden Hour'",
    content: "Tips créateur : La lumière juste après le lever et avant le coucher du soleil est douce, dorée et flatteuse. Elle crée de longues ombres et une atmosphère magique. Planifiez vos shootings autour de ces créneaux pour un contenu qui se démarque instantanément.",
    icon: "Sunrise",
  },
  {
    level: 4,
    title: "Votre Niche : Mieux vaut être un Grand Poisson dans une Petite Mare",
    content: "Tips influenceur : Ne parlez pas à tout le monde. Parlez à 'quelqu'un'. Spécialisez-vous. Que ce soit la macro-photographie d'insectes ou les portraits en noir et blanc, une niche forte bâtit une communauté plus engagée qu'un sujet trop large.",
    icon: "Target",
  },
  {
    level: 5,
    title: "Le Storytelling en 3 Actes",
    content: "Tips créateur : Une bonne publication, c'est une mini-histoire. Acte 1 : une image qui accroche (le problème/la situation). Acte 2 : une description qui développe (le voyage/la solution). Acte 3 : un appel à l'action qui engage ('Et vous, qu'en pensez-vous ?').",
    icon: "BookOpenText",
  },
  {
    level: 6,
    title: "L'Héritage du Kodachrome : La Couleur comme Signature",
    content: "Fait historique : Le film Kodachrome était célèbre pour ses couleurs vives et uniques. Aujourd'hui, vos 'presets' (préréglages) sont votre Kodachrome. Développez une palette de couleurs cohérente pour que vos photos soient reconnaissables au premier coup d'œil.",
    icon: "Palette",
  },
  {
    level: 7,
    title: "Le 'Hook' des 3 Premières Secondes",
    content: "Tips créateur : Sur les réseaux, vous avez 3 secondes pour capter l'attention. Votre image doit poser une question, surprendre ou susciter une émotion immédiatement. Le titre de votre publication doit compléter ce 'hook', pas le répéter.",
    icon: "Timer",
  },
  {
    level: 8,
    title: "L'Engagement > Le Nombre d'Abonnés",
    content: "Tips influenceur : 100 abonnés qui commentent et partagent ont plus de valeur que 10 000 'fantômes'. Concentrez-vous sur la création de contenu qui suscite la discussion. Répondez à chaque commentaire. Créez des liens, pas seulement une audience.",
    icon: "MessageSquare",
  },
  {
    level: 9,
    title: "Les Lignes Directrices : Le GPS du Regard",
    content: "Tips photo : Utilisez les routes, les ponts, les rampes d'escalier ou les ombres comme des flèches invisibles pour guider l'œil du spectateur vers votre sujet principal. C'est une technique de composition subtile mais incroyablement puissante.",
    icon: "Baseline",
  },
  {
    level: 10,
    title: "De la Lanterne Magique au Carrousel Instagram",
    content: "Fait historique : Au 17ème siècle, la 'lanterne magique' projetait des images peintes pour raconter une histoire. Le carrousel Instagram est son descendant direct. Utilisez-le pour montrer un 'avant/après', un tutoriel ou les coulisses d'une photo.",
    icon: "GalleryHorizontal",
  },
  {
    level: 11,
    title: "Le Format RAW : Votre Négatif Numérique",
    content: "Tips photo : Si votre appareil le permet, shootez en RAW. C'est un fichier brut qui capture un maximum d'informations. En retouche, vous aurez une liberté totale pour ajuster les couleurs et la lumière sans perdre en qualité. C'est le choix des pros.",
    icon: "FileSliders",
  },
  {
    level: 12,
    title: "Le 'Personal Branding' : Vous êtes la Marque",
    content: "Tips influenceur : Votre style photo, votre ton, vos valeurs... tout cela constitue votre marque personnelle. Soyez cohérent sur toutes les plateformes. Les gens ne suivent pas juste des photos, ils suivent une personnalité, une vision du monde.",
    icon: "Award",
  },
  {
    level: 13,
    title: "L'Ouverture et le 'Bokeh'",
    content: "Tips photo : Pour un portrait qui claque, utilisez une grande ouverture (un petit chiffre f/, comme f/1.8). Cela va créer un arrière-plan magnifiquement flou (le fameux 'bokeh') qui isole votre sujet et lui donne toute l'attention.",
    icon: "Aperture",
  },
  {
    level: 14,
    title: "La Monétisation n'est pas un Tabou",
    content: "Tips influenceur : Liens d'affiliation, presets à vendre, collaborations avec des marques, tirages photo... Il existe 100 façons de monétiser votre passion. Commencez petit. La clé est l'authenticité : ne recommandez que ce que vous aimez vraiment.",
    icon: "DollarSign",
  },
  {
    level: 15,
    title: "Du Dagoberrotype au 'Feed' Instagram",
    content: "Fait historique : Les premiers photographes exposaient leurs œuvres uniques dans des cadres précieux. Votre 'feed' ou votre galerie est votre cadre moderne. Pensez à l'harmonie globale de vos images côte à côte, pas seulement individuellement.",
    icon: "LayoutGrid",
  },
  {
    level: 16,
    title: "Analyse tes 'Stats' : Le Pouvoir des Données",
    content: "Tips créateur : Ne naviguez pas à vue. Plongez dans vos statistiques. Quels formats fonctionnent le mieux ? À quelle heure votre audience est-elle la plus active ? Les données sont vos meilleures alliées pour grandir plus vite.",
    icon: "BarChart2",
  },
  {
    level: 17,
    title: "Le Contenu 'Behind The Scenes'",
    content: "Tips créateur : Les gens adorent voir les coulisses ! Partagez une story de votre shooting, montrez votre processus de retouche, parlez de vos échecs. La vulnérabilité et la transparence créent un lien de confiance très fort avec votre audience.",
    icon: "Film",
  },
  {
    level: 18,
    title: "L'Équipement ne Fait pas le Photographe",
    content: "Tips photo : Un meilleur appareil ne fera pas de vous un meilleur photographe. La composition, la lumière et le sens de l'instant sont 1000 fois plus importants. Le meilleur appareil est celui que vous avez sur vous, alors maîtrisez-le à fond.",
    icon: "Smartphone",
  },
  {
    level: 19,
    title: "La 'Longue Traîne' des Hashtags",
    content: "Tips créateur : Ne visez pas que les hashtags à 1 million de publications. Utilisez une stratégie mixte : 3-4 hashtags très populaires, 5-6 de taille moyenne, et 2-3 hashtags de niche très spécifiques à votre contenu. C'est là que vous trouverez votre cœur de cible.",
    icon: "Tags",
  },
  {
    level: 20,
    title: "Brisez les Règles (mais en connaissance de cause)",
    content: "Tips photo & créateur : Vous maîtrisez la technique, la lumière, le storytelling. Il est temps de tout casser. Surexposez volontairement. Cadrez de manière audacieuse. C'est en sortant des sentiers battus que vous créerez un style vraiment unique. Vous êtes l'artiste.",
    icon: "Bomb",
  },
];

