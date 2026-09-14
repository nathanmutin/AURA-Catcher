import React, { useEffect, useId, useRef } from 'react';
import { CircleQuestionMark } from 'lucide-react';
import type { PanelType } from '@shared/types';
import './ScoreHelp.css';

const VIEWPORT_MARGIN = 8;
const GAP = 8;

// Types regroupés par valeur, du plus au moins de points :
// « 5 pts — Commune, Lycée, Sécurité ». Lu depuis l'API pour que la bulle
// suive le barème réellement en base.
function groupTypesByPoints(types: PanelType[]): Array<{ points: number; names: string[] }> {
    const namesByPoints = new Map<number, string[]>();
    types.forEach((type) => {
        namesByPoints.set(type.points, [...(namesByPoints.get(type.points) ?? []), type.name]);
    });
    return [...namesByPoints.entries()]
        .sort(([a], [b]) => b - a)
        .map(([points, names]) => ({ points, names }));
}

/**
 * « ? » à côté de l'en-tête « Score », qui ouvre une bulle expliquant le
 * calcul.
 *
 * La bulle est un popover natif : il s'affiche au-dessus de toute la page,
 * donc le conteneur du tableau (qui défile horizontalement) ne peut pas la
 * couper, et le navigateur gère seul la fermeture (clic à l'extérieur,
 * Échap, nouveau clic sur le « ? »). Il ne reste qu'à la placer sous le
 * bouton — le positionnement par ancre CSS n'étant pas encore disponible
 * partout.
 */
const ScoreHelp: React.FC<{ types: PanelType[] }> = ({ types }) => {
    const popoverId = useId();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const button = buttonRef.current;
        const popover = popoverRef.current;
        if (!button || !popover) return;

        const place = () => {
            const anchor = button.getBoundingClientRect();
            const anchorCenter = anchor.left + anchor.width / 2;
            const { offsetWidth: width, offsetHeight: height } = popover;

            // Centrée sous le « ? », mais sans sortir de l'écran : sur mobile
            // la colonne Score est collée au bord droit.
            const left = Math.min(
                Math.max(VIEWPORT_MARGIN, anchorCenter - width / 2),
                window.innerWidth - width - VIEWPORT_MARGIN
            );
            // Au-dessus du bouton s'il n'y a pas la place en dessous.
            const above = anchor.bottom + GAP + height > window.innerHeight - VIEWPORT_MARGIN
                && anchor.top - GAP - height >= VIEWPORT_MARGIN;

            popover.style.left = `${left}px`;
            popover.style.top = `${above ? anchor.top - GAP - height : anchor.bottom + GAP}px`;
            popover.style.setProperty('--arrow-left', `${anchorCenter - left}px`);
            popover.classList.toggle('score-help-popover--above', above);
        };

        // beforetoggle précède l'affichage dans la même tâche : placer la
        // bulle dans la frame suivante évite de la voir un instant au centre
        // de l'écran, où le navigateur la pose par défaut.
        const onBeforeToggle = (event: Event) => {
            if ((event as ToggleEvent).newState === 'open') {
                requestAnimationFrame(place);
                window.addEventListener('scroll', place, true);
                window.addEventListener('resize', place);
            } else {
                window.removeEventListener('scroll', place, true);
                window.removeEventListener('resize', place);
            }
        };

        popover.addEventListener('beforetoggle', onBeforeToggle);
        return () => {
            popover.removeEventListener('beforetoggle', onBeforeToggle);
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, []);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className="score-help-button"
                popoverTarget={popoverId}
                aria-label="Comment le score est calculé"
            >
                <CircleQuestionMark size={16} aria-hidden="true" />
            </button>

            <div ref={popoverRef} id={popoverId} popover="auto" className="score-help-popover">
                <p className="score-help-title">Comment le score est calculé</p>
                <p>
                    Pour réduire l'importance des arrêts de bus ou des bornes Oura
                    (présents en grand nombre), chaque type rapporte son propre nombre
                    de points. Un panneau cumule les points de tous ses types :
                </p>
                <ul className="score-help-points">
                    {groupTypesByPoints(types).map(({ points, names }) => (
                        <li key={points}>
                            <strong>{points} {points > 1 ? 'pts' : 'pt'}</strong>
                            <span>{names.join(', ')}</span>
                        </li>
                    ))}
                </ul>
                <p>
                    Les points récompensent la découverte : ils vont à la personne qui a ajouté le
                    panneau. Le corriger ou y ajouter une photo ne rapporte rien.
                </p>
                <p>Les panneaux sans pseudo ne comptent pour personne.</p>
            </div>
        </>
    );
};

export default ScoreHelp;
