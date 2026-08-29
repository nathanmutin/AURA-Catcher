// Échappe le texte fourni par l'utilisateur (pseudo) avant de l'insérer dans
// du HTML (email de vérification, page de confirmation) — évite l'injection
// de balises si quelqu'un choisit un pseudo du type "<img onerror=...>".
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
