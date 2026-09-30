import { useEffect, useState } from 'react';

/**
 * Suit une media query en JavaScript.
 *
 * Les deux navigations (barre du bas et rail) vivent dans la page et c'est le
 * CSS qui cache l'une ou l'autre. Le menu d'ajout, lui, ne doit exister qu'en
 * un seul exemplaire : il se pose au-dessus du reste de la page et deux
 * copies signifieraient deux écouteurs de clavier.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

        setMatches(mediaQuery.matches);
        mediaQuery.addEventListener('change', onChange);
        return () => mediaQuery.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}

// Même point de rupture que la feuille de style de la navigation.
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 768px)');
