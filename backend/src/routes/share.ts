import { Router, Response } from 'express';
import { asyncHandler } from '../errors';
import { parseId } from '../validation';
import { getPanneau, listTypes } from '../services/panneauxService';
import { getGaleriePhoto } from '../services/galerieService';
import { renderSharePage } from '../shareHtml';
import { SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT } from '../imageUtils';
import { PUBLIC_URL } from '../config';

const router = Router();

// Faute de photo (un panneau en a toujours une, mais la page ne doit pas
// casser pour autant), l'image du site sert de repli — c'est celle que
// l'index.html du front annonce déjà.
const FALLBACK_IMAGE = `${PUBLIC_URL}/screenshot.jpeg`;

const formatDate = (iso: string) => new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
}).format(new Date(iso));

// « Recensé » pour un panneau, qui entre dans un décompte ; « ajouté »
// pour un objet, qui ne fait que rejoindre la galerie.
const credit = (verb: string, author: string | undefined, createdAt: string) => (author
    ? `${verb} par ${author} le ${formatDate(createdAt)}.`
    : `${verb} le ${formatDate(createdAt)}.`);

// Pas de redirection pour un objet inconnu : renvoyer vers la carte ou la
// galerie avec un identifiant qui n'existe pas n'y afficherait rien.
function sendNotFound(res: Response, url: string, title: string, description: string, link: { href: string; label: string }) {
    res.status(404).type('html').send(renderSharePage({
        url,
        title,
        description,
        image: { url: FALLBACK_IMAGE, alt: 'AURA Catcher' },
        link,
    }));
}

/**
 * GET /panneau/:id
 * L'adresse à partager pour un panneau précis : elle porte les balises Open
 * Graph de ce panneau-là, puis renvoie le visiteur sur la carte.
 *
 * Volontairement hors de /api : c'est une adresse destinée à être collée
 * dans une conversation, pas une ressource de l'API. Elle n'existe que côté
 * serveur, donc nginx (prod) et Vite (dev) doivent l'acheminer jusqu'ici.
 */
router.get('/panneau/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const panneau = id === null ? null : await getPanneau(id);
    const url = `${PUBLIC_URL}/panneau/${req.params.id}`;

    if (!panneau) {
        sendNotFound(res, url, 'Panneau introuvable — AURA Catcher',
            "Ce panneau n'existe pas ou plus. La carte, elle, est toujours là.",
            { href: '/', label: 'Voir la carte' });
        return;
    }

    const types = await listTypes();
    const typeNames: string[] = panneau.typeIds
        .map((typeId) => types.find((type: { id: number }) => Number(type.id) === typeId)?.name)
        .filter((name: string | undefined): name is string => Boolean(name));

    const title = typeNames.length > 0
        ? `Panneau ${typeNames.join(', ')}`
        : 'Panneau de la Région';

    const imageId = panneau.imageIds[0];
    const mapUrl = `/?panneauId=${panneau.id}`;
    const line = credit('Recensé', panneau.author, panneau.createdAt);

    res.type('html').send(renderSharePage({
        url: `${PUBLIC_URL}/panneau/${panneau.id}`,
        title,
        description: panneau.comment ? `${panneau.comment} — ${line}` : line,
        image: imageId
            ? {
                url: `${PUBLIC_URL}/api/photo/${imageId}/apercu.jpg`,
                alt: title,
                width: SHARE_IMAGE_WIDTH,
                height: SHARE_IMAGE_HEIGHT,
            }
            : { url: FALLBACK_IMAGE, alt: title },
        redirectTo: mapUrl,
        link: { href: mapUrl, label: 'Voir sur la carte' },
    }));
}));

/**
 * GET /objet/:id
 * Le pendant pour une photo de la galerie. Un objet n'a pas de type : c'est
 * sa légende qui fait le titre, et le générique passe en description.
 */
router.get('/objet/:id', asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const photo = id === null ? null : await getGaleriePhoto(id);
    const url = `${PUBLIC_URL}/objet/${req.params.id}`;

    if (!photo) {
        sendNotFound(res, url, 'Objet introuvable — AURA Catcher',
            "Cette photo n'existe pas ou plus. La galerie, elle, est toujours là.",
            { href: '/galerie', label: 'Voir la galerie' });
        return;
    }

    const title = photo.caption || 'Objet aux couleurs de la Région';
    const galerieUrl = `/galerie?photo=${photo.id}`;

    res.type('html').send(renderSharePage({
        url: `${PUBLIC_URL}/objet/${photo.id}`,
        title,
        description: credit('Ajouté', photo.author, photo.createdAt),
        image: {
            url: `${PUBLIC_URL}/api/galerie/${photo.id}/apercu.jpg`,
            alt: title,
            width: SHARE_IMAGE_WIDTH,
            height: SHARE_IMAGE_HEIGHT,
        },
        redirectTo: galerieUrl,
        link: { href: galerieUrl, label: 'Voir dans la galerie' },
    }));
}));

export default router;
