import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ImagePlus } from 'lucide-react';
import type { GaleriePhoto } from '@shared/types';
import { fetchGaleriePhotos, galeriePhotoUrl } from '../api/client';
import { formatShortDate, formatFullDate } from '../utils/dates';
import AddGaleriePhotoModal from '../components/Galerie/AddGaleriePhotoModal';
import GaleriePhotoViewer from '../components/Galerie/GaleriePhotoViewer';
import './GaleriePage.css';

const PAGE_SIZE = 24;

/**
 * La galerie : les objets aux couleurs de la Région qui n'ont pas de place
 * fixe, donc pas de carte — trains, cars, gobelets. Collaborative comme les
 * panneaux : chacun ajoute sous son pseudo et peut corriger une légende.
 */
const GaleriePage: React.FC = () => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isAdding, setIsAdding] = useState(false);
    // La photo ouverte vit dans l'URL (?photo=142) : elle se partage et le
    // bouton retour referme la visionneuse au lieu de quitter la galerie.
    const [searchParams, setSearchParams] = useSearchParams();

    const { data: photos = [], isLoading } = useQuery<GaleriePhoto[]>({
        queryKey: ['galerie'],
        queryFn: fetchGaleriePhotos,
    });

    // Le bouton + de la navigation amène ici avec « ajouter=1 ».
    useEffect(() => {
        if (searchParams.get('ajouter') !== '1') return;
        setIsAdding(true);
        const params = new URLSearchParams(searchParams);
        params.delete('ajouter');
        setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    const openedId = Number(searchParams.get('photo')) || null;
    const openedIndex = photos.findIndex((photo) => photo.id === openedId);
    const opened = openedIndex >= 0 ? photos[openedIndex] : null;

    // Ouvrir et fermer empilent une entrée d'historique, passer d'une photo à
    // l'autre la remplace : sinon, après vingt photos parcourues, il faudrait
    // vingt retours pour sortir de la visionneuse.
    const openPhoto = (id: number | null, replace = false) => {
        const params = new URLSearchParams(searchParams);
        if (id === null) params.delete('photo'); else params.set('photo', String(id));
        setSearchParams(params, { replace });
    };

    const now = new Date();

    return (
        <div className="galerie-container">
            <div className="galerie-header">
                <div>
                    <h1 className="galerie-title">Galerie</h1>
                    <p className="galerie-subtitle">
                        Les plus belles photos d'objets aux couleurs de notre Région : trains, cars, minibus, goodies.
                    </p>
                </div>
                <button type="button" className="btn-primary galerie-add-btn" onClick={() => setIsAdding(true)}>
                    <ImagePlus size={18} /> Ajouter une photo
                </button>
            </div>

            {isLoading ? (
                <p className="galerie-empty">Chargement...</p>
            ) : photos.length === 0 ? (
                <p className="galerie-empty">Aucune photo pour l'instant. La première est à vous.</p>
            ) : (
                <>
                    <ul className="galerie-grid">
                        {photos.slice(0, visibleCount).map((photo) => (
                            <li key={photo.id}>
                                <button type="button" className="galerie-photo" onClick={() => openPhoto(photo.id)}>
                                    <img src={galeriePhotoUrl(photo.id)} alt={photo.caption ?? ''} loading="lazy" />
                                    <span className="galerie-photo-info">
                                        {photo.caption && <span className="galerie-photo-caption">{photo.caption}</span>}
                                        <span className="galerie-photo-meta">
                                            {photo.author || 'Anonyme'} ·{' '}
                                            <time dateTime={photo.createdAt} title={formatFullDate(photo.createdAt)}>
                                                {formatShortDate(photo.createdAt, now)}
                                            </time>
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {visibleCount < photos.length && (
                        <div className="galerie-more">
                            <button
                                type="button"
                                className="galerie-more-btn"
                                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                            >
                                Voir plus de photos <ChevronDown size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {isAdding && (
                <AddGaleriePhotoModal
                    onClose={() => setIsAdding(false)}
                    onSuccess={(photo) => {
                        setIsAdding(false);
                        openPhoto(photo.id);
                    }}
                />
            )}

            {opened && (
                <GaleriePhotoViewer
                    photo={opened}
                    hasPrevious={openedIndex > 0}
                    hasNext={openedIndex < photos.length - 1}
                    onPrevious={() => openPhoto(photos[openedIndex - 1].id, true)}
                    onNext={() => openPhoto(photos[openedIndex + 1].id, true)}
                    onClose={() => openPhoto(null)}
                />
            )}
        </div>
    );
};

export default GaleriePage;
