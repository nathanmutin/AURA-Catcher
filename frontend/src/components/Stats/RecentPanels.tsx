import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ImageOff, Images } from 'lucide-react';
import type { PanelType, Panneau } from '@shared/types';
import { photoUrl } from '../../api/client';
import './RecentPanels.css';

const PAGE_SIZE = 12;
const RELATIVE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const relativeFormat = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * « aujourd'hui », « hier », « il y a 3 jours » pendant une semaine, puis la
 * date (« 8 juil. », avec l'année si ce n'est pas l'année en cours).
 *
 * On compte en jours calendaires et non en tranches de 24 h : un panneau
 * ajouté hier à 23 h est « hier », même consulté le lendemain à 8 h.
 */
function formatPanelDate(iso: string, now: Date): string {
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

interface Props {
    // Déjà triés du plus récent au plus ancien par l'API.
    panneaux: Panneau[];
    types: PanelType[];
}

/**
 * Derniers panneaux ajoutés, en cartes : la photo d'abord, puis seulement
 * les informations renseignées. Chaque carte est un lien vers le panneau
 * sur la carte.
 */
const RecentPanels: React.FC<Props> = ({ panneaux, types }) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const typeNameById = new Map(types.map((type) => [type.id, type.name]));
    const now = new Date();

    return (
        <div className="stats-section">
            <h2 className="section-title">Derniers panneaux</h2>

            <ul className="recent-panels">
                {panneaux.slice(0, visibleCount).map((panneau) => {
                    const typeNames = panneau.typeIds
                        .map((typeId) => typeNameById.get(typeId))
                        .filter((name): name is string => Boolean(name));
                    const photoCount = panneau.imageIds.length;

                    return (
                        <li key={panneau.id}>
                            <Link to={`/?panneauId=${panneau.id}`} className="recent-panel">
                                <div className="recent-panel-photo">
                                    {photoCount > 0 ? (
                                        // alt vide : la carte décrit déjà le panneau en texte juste en dessous.
                                        <img src={photoUrl(panneau.imageIds[0])} alt="" loading="lazy" />
                                    ) : (
                                        <ImageOff size={28} aria-hidden="true" />
                                    )}
                                    {photoCount > 1 && (
                                        <span className="recent-panel-photo-count">
                                            <Images size={12} aria-hidden="true" /> {photoCount} photos
                                        </span>
                                    )}
                                </div>

                                <div className="recent-panel-body">
                                    {typeNames.length > 0 && (
                                        <div className="recent-panel-types">
                                            {typeNames.map((name) => (
                                                <span key={name} className="recent-panel-type">{name}</span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="recent-panel-meta">
                                        {panneau.author || 'Anonyme'} ·{' '}
                                        <time
                                            dateTime={panneau.createdAt}
                                            title={new Date(panneau.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                                        >
                                            {formatPanelDate(panneau.createdAt, now)}
                                        </time>
                                    </p>
                                    {panneau.comment && (
                                        <p className="recent-panel-comment" title={panneau.comment}>{panneau.comment}</p>
                                    )}
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {visibleCount < panneaux.length && (
                <div className="stats-more">
                    <button
                        type="button"
                        className="stats-more-button"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    >
                        Voir plus de panneaux <ChevronDown size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentPanels;
