import { escapeHtml } from './htmlEscape';
import { PUBLIC_URL } from './config';
import type { FeedItem } from './services/feedService';

// escapeHtml échappe les 5 entités XML de base (&, <, >, ", ') : les mêmes
// règles s'appliquent au HTML et au XML, pas besoin d'une fonction dédiée.

// Un "]]>" littéral dans le texte casserait la section CDATA qui l'englobe
// (ex: si un commentaire utilisateur contient volontairement cette séquence).
// C'est l'échappement standard pour ce cas : fermer puis rouvrir la CDATA.
function escapeCdata(value: string): string {
    return value.replace(/]]>/g, ']]]]><![CDATA[>');
}

// La description est envoyée en CDATA contenant du HTML : la plupart des
// lecteurs de flux rendent ce HTML, donc la photo apparaît directement dans
// l'aperçu de l'élément plutôt que d'être juste une pièce jointe technique.
// Le texte d'origine (potentiellement fourni par un utilisateur, ex: un
// commentaire de panneau) reste échappé pour ne pas injecter de balises dans
// le rendu HTML du lecteur — seules les balises qu'on ajoute nous-mêmes
// (<img>, <p>) sont volontairement laissées littérales.
//
// Pas de texte générique de repli ("Un nouveau panneau a été ajouté...") si
// le panneau n'a pas de commentaire : on omet la <description> plutôt que
// d'y mettre une phrase qui ne dit rien (la photo, elle, reste affichée).
function renderDescription(item: FeedItem): string {
    const text = item.description ? escapeHtml(item.description) : null;

    if (!item.image) {
        return text ? `<description>${text}</description>` : '';
    }

    const html = `<img src="${item.image.url}" alt="Photo du panneau" />` + (text ? `<p>${text}</p>` : '');
    return `<description><![CDATA[${escapeCdata(html)}]]></description>`;
}

// <enclosure> est le mécanisme RSS standard pour attacher un média à un
// élément (photo, ici) — utilisé par les lecteurs qui n'affichent pas le
// HTML de la description mais reconnaissent les pièces jointes.
function renderEnclosure(item: FeedItem): string {
    if (!item.image) return '';
    return `\n      <enclosure url="${escapeHtml(item.image.url)}" length="${item.image.length}" type="${escapeHtml(item.image.type)}" />`;
}

function renderItem(item: FeedItem): string {
    return `
    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${escapeHtml(item.link)}</link>
      <guid isPermaLink="false">${escapeHtml(item.guid)}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      ${renderDescription(item)}${renderEnclosure(item)}
    </item>`;
}

export function renderRssFeed(items: FeedItem[]): string {
    const itemsXml = items.map(renderItem).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AURA Catcher — Activité récente</title>
    <link>${escapeHtml(PUBLIC_URL)}</link>
    <description>Derniers panneaux, photos et contributeurs sur AURA Catcher</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${itemsXml}
  </channel>
</rss>
`;
}
