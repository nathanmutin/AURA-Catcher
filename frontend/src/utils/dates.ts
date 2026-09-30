const RELATIVE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const relativeFormat = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * « aujourd'hui », « hier », « il y a 3 jours » pendant une semaine, puis la
 * date (« 8 juil. », avec l'année si ce n'est pas l'année en cours).
 *
 * On compte en jours calendaires et non en tranches de 24 h : une photo
 * ajoutée hier à 23 h est « hier », même consultée le lendemain à 8 h.
 */
export function formatShortDate(iso: string, now: Date): string {
    const date = new Date(iso);
    const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
    if (days >= 0 && days < RELATIVE_DAYS) {
        return relativeFormat.format(-days, 'day');
    }
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    });
}

// Date complète, pour l'infobulle qui accompagne la date courte.
export const formatFullDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long' });
