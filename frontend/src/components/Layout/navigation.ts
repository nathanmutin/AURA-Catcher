import { ChartBar, Info, Map, Package, Signpost, SquarePen, User, type LucideIcon } from 'lucide-react';

export interface NavEntry {
    to: string;
    label: string;
    icon: LucideIcon;
    // Le compte n'occupe pas un des cinq emplacements de la barre du bas :
    // sur mobile, il vit dans l'en-tête, où il ne prend la place de rien.
    railOnly?: boolean;
}

/**
 * Les destinations du site, dans l'ordre où elles apparaissent.
 *
 * Une seule liste pour les deux mises en page — la barre du bas sur mobile,
 * le rail à gauche sur ordinateur — pour que les deux ne puissent pas
 * diverger. Le bouton d'ajout se glisse au milieu de la barre du bas, et
 * vient en dernier dans le rail.
 *
 * « Objets » plutôt que « Galerie » : le mot galerie promet des photos, et
 * une photo de panneau est une photo — d'où les panneaux qui finissaient
 * dans la galerie. « Objets » face à « Carte » oppose une chose à un lieu,
 * ce qui est la vraie règle, et un libellé d'un mot se lit, contrairement
 * au sous-titre d'une page.
 */
export const NAV_ENTRIES: NavEntry[] = [
    { to: '/', label: 'Carte', icon: Map },
    { to: '/galerie', label: 'Objets', icon: Package },
    { to: '/stats', label: 'Stats', icon: ChartBar },
    { to: '/projet', label: 'À propos', icon: Info },
    { to: '/compte', label: 'Compte', icon: User, railOnly: true },
];

export interface AddChoice {
    to: string;
    label: string;
    // Trois ou quatre mots : de quoi trancher sans lire une phrase.
    hint: string;
    icon: LucideIcon;
}

/**
 * Le choix d'ajout, proposé par la même modale quel que soit le bouton
 * utilisé. Deux cases côte à côte, pour qu'elles se comparent d'un regard :
 * ce qui distingue les deux n'est pas la photo (les deux en sont une) mais
 * le fait d'avoir une place fixe ou non.
 *
 * Chaque choix est une simple adresse, et c'est la page d'arrivée qui ouvre
 * son formulaire en voyant le paramètre « ajouter ». Choisir revient donc à
 * naviguer, et un lien partagé ouvre la même chose.
 */
export const ADD_CHOICES: AddChoice[] = [
    { to: '/?ajouter=1', label: 'Panneau', hint: 'Fixé à un endroit', icon: Signpost },
    { to: '/galerie?ajouter=1', label: 'Objet', hint: 'Train, car, goodies', icon: Package },
];

// Le générateur ne contribue à rien : il ne fait pas partie du choix, mais
// la modale d'ajout reste le seul endroit d'où on y accède.
export const GENERATOR_ENTRY: NavEntry = { to: '/farmer', label: 'Créer un faux panneau', icon: SquarePen };
