import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ImageOff, Images } from 'lucide-react';
import type { PanelType, Panneau } from '@shared/types';
import { photoUrl } from '../../api/client';
import { formatShortDate, formatFullDate } from '../../utils/dates';
import './RecentPanels.css';

// Un simple aperçu : la page Projet parle d'abord de chiffres et de
// classement, la collection complète se regarde sur la carte.
const INITIAL_COUNT = 4;
// « Voir plus » en révèle davantage à la fois, pour ne pas obliger à cliquer
// dix fois quand on veut vraiment parcourir.
const MORE_COUNT = 12;

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
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

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
                                            title={formatFullDate(panneau.createdAt)}
                                        >
                                            {formatShortDate(panneau.createdAt, now)}
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
                        onClick={() => setVisibleCount((count) => count + MORE_COUNT)}
                    >
                        Voir plus de panneaux <ChevronDown size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentPanels;
