import { escapeHtml } from './htmlEscape';

/**
 * La page servie à l'adresse de partage d'un panneau.
 *
 * Elle existe pour une seule raison : WhatsApp, Signal, Mastodon et les
 * autres ne lisent que le HTML renvoyé par le serveur. L'application étant
 * une page unique construite dans le navigateur, un lien partagé vers la
 * carte leur montrait toujours les mêmes balises — titre du site et capture
 * d'écran générique — quelle que soit la photo partagée.
 *
 * Un humain, lui, n'a rien à faire ici : la redirection l'emmène sur la
 * carte. Elle est écrite en `meta refresh` et non en JavaScript, parce que
 * Helmet interdit les scripts en ligne (`script-src 'self'`) et qu'un
 * script serait donc bloqué par le navigateur.
 */
export interface SharePage {
    // Adresse canonique de cette page, absolue (les réseaux refusent le relatif).
    url: string;
    title: string;
    description: string;
    image: { url: string; alt: string; width?: number; height?: number };
    // Où envoyer un visiteur humain. Absent = page sans issue (panneau
    // introuvable), qui propose simplement la carte.
    redirectTo?: string;
    // Lien visible, pour qui ne suit pas la redirection.
    link: { href: string; label: string };
}

export function renderSharePage(page: SharePage): string {
    const { url, title, description, image, redirectTo, link } = page;

    const attr = (value: string) => escapeHtml(value);

    const imageMeta = [
        `<meta property="og:image" content="${attr(image.url)}" />`,
        `<meta property="og:image:alt" content="${attr(image.alt)}" />`,
        // Annoncées seulement quand on connaît la taille : Facebook et
        // WhatsApp choisissent la grande vignette sans aller chercher le
        // fichier, mais une dimension fausse casse le rendu.
        ...(image.width && image.height
            ? [
                `<meta property="og:image:width" content="${image.width}" />`,
                `<meta property="og:image:height" content="${image.height}" />`,
            ]
            : []),
    ].join('\n    ');

    return `<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${redirectTo ? `<meta http-equiv="refresh" content="0; url=${attr(redirectTo)}" />` : ''}
    <title>${attr(title)}</title>
    <meta name="description" content="${attr(description)}" />
    <link rel="canonical" href="${attr(url)}" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="AURA Catcher" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:url" content="${attr(url)}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(description)}" />
    ${imageMeta}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(description)}" />
    <meta name="twitter:image" content="${attr(image.url)}" />

    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
               background: #f0f9ff; color: #1e293b; text-align: center;
               font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        main { max-width: 32rem; padding: 1.5rem; }
        img { max-width: 100%; border-radius: 12px; }
        h1 { font-size: 1.25rem; }
        p { color: #64748b; }
        a { display: inline-block; margin-top: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 1rem;
            background: #008ecf; color: white; font-weight: 600; text-decoration: none; }
    </style>
</head>
<body>
    <main>
        <img src="${attr(image.url)}" alt="${attr(image.alt)}" />
        <h1>${attr(title)}</h1>
        <p>${attr(description)}</p>
        <a href="${attr(link.href)}">${attr(link.label)}</a>
    </main>
</body>
</html>
`;
}
