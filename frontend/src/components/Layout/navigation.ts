import { ChartBar, ImagePlus, Images, Info, Map, MapPinPlus, SquarePen, User, type LucideIcon } from 'lucide-react';

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
 */
export const NAV_ENTRIES: NavEntry[] = [
    { to: '/', label: 'Carte', icon: Map },
    { to: '/galerie', label: 'Galerie', icon: Images },
    { to: '/stats', label: 'Stats', icon: ChartBar },
    { to: '/projet', label: 'À propos', icon: Info },
    { to: '/compte', label: 'Compte', icon: User, railOnly: true },
];

/**
 * Le contenu du bouton + : les façons de contribuer.
 *
 * Chacune est une simple adresse, et c'est la page d'arrivée qui ouvre son
 * formulaire en voyant le paramètre « ajouter ». Contribuer depuis n'importe
 * où revient donc à naviguer, et un lien partagé ouvre la même chose.
 */
export const ADD_ENTRIES: NavEntry[] = [
    { to: '/?ajouter=1', label: 'Photographier un panneau', icon: MapPinPlus },
    { to: '/galerie?ajouter=1', label: 'Ajouter une photo à la galerie', icon: ImagePlus },
    { to: '/farmer', label: 'Créer un faux panneau', icon: SquarePen },
];
