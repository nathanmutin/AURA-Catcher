import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pencil, User, X } from 'lucide-react';
import type { GaleriePhoto } from '@shared/types';
import { galeriePhotoUrl, updateGalerieCaption } from '../../api/client';
import { ApiError } from '../../api/apiClient';
import { useDefaultAuthor } from '../PanelForm/AuthorField';
import { formatFullDate } from '../../utils/dates';
import './Galerie.css';

interface Props {
    photo: GaleriePhoto;
    hasPrevious: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
}

/**
 * La photo en grand, avec sa légende modifiable sur place.
 *
 * La légende est le seul champ modifiable de la galerie, et elle l'est par tout le
 * monde, comme la description d'un panneau. Sans historique : seul le
 * journal du serveur garde la trace de qui l'a changée.
 */
const GaleriePhotoViewer: React.FC<Props> = ({ photo, hasPrevious, hasNext, onPrevious, onNext, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();
    const author = useDefaultAuthor();

    // Changer de photo referme l'édition en cours : la légende affichée doit
    // toujours être celle de la photo qu'on regarde.
    useEffect(() => {
        setIsEditing(false);
        setErrorMsg('');
    }, [photo.id]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isEditing) return;
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft' && hasPrevious) onPrevious();
            if (event.key === 'ArrowRight' && hasNext) onNext();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isEditing, hasPrevious, hasNext, onPrevious, onNext, onClose]);

    const mutation = useMutation({
        mutationFn: () => updateGalerieCaption(photo.id, draft, author || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['galerie'] });
            setIsEditing(false);
        },
        onError: (err) => {
            setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement. Réessayez.');
        },
    });

    return (
        <div className="galerie-viewer" onClick={onClose}>
            <button className="galerie-viewer-close" onClick={onClose} aria-label="Fermer">
                <X size={22} />
            </button>

            {hasPrevious && (
                <button
                    className="galerie-viewer-nav galerie-viewer-nav--prev"
                    onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                    aria-label="Photo précédente"
                >
                    <ChevronLeft size={28} />
                </button>
            )}
            {hasNext && (
                <button
                    className="galerie-viewer-nav galerie-viewer-nav--next"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    aria-label="Photo suivante"
                >
                    <ChevronRight size={28} />
                </button>
            )}

            {/* Le clic sur la photo et sur ses informations ne referme pas. */}
            <figure className="galerie-viewer-figure" onClick={(e) => e.stopPropagation()}>
                <img src={galeriePhotoUrl(photo.id, false)} alt={photo.caption ?? 'Photo de la galerie'} />

                <figcaption className="galerie-viewer-info">
                    {isEditing ? (
                        <form
                            className="galerie-viewer-edit"
                            onSubmit={(e) => { e.preventDefault(); setErrorMsg(''); mutation.mutate(); }}
                        >
                            <input
                                type="text"
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                placeholder="Ex: TER floqué, gare de Valence"
                                autoFocus
                            />
                            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                                {mutation.isPending ? '...' : 'Enregistrer'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                                Annuler
                            </button>
                        </form>
                    ) : (
                        <p className="galerie-viewer-caption">
                            {photo.caption || <span className="galerie-viewer-nocaption">Sans légende</span>}
                            <button
                                type="button"
                                className="galerie-viewer-edit-btn"
                                onClick={() => { setDraft(photo.caption ?? ''); setIsEditing(true); }}
                            >
                                <Pencil size={14} /> Modifier la légende
                            </button>
                        </p>
                    )}

                    {errorMsg && <p className="galerie-error">{errorMsg}</p>}

                    <p className="galerie-viewer-meta">
                        <User size={12} /> {photo.author || 'Anonyme'}
                        {' · '}
                        <time dateTime={photo.createdAt}>{formatFullDate(photo.createdAt)}</time>
                    </p>
                </figcaption>
            </figure>
        </div>
    );
};

export default GaleriePhotoViewer;
