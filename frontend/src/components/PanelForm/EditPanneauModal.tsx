import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Undo2 } from 'lucide-react';
import type { EditableField, PanelType, Panneau } from '@shared/types';
import { fetchPanneauHistory, fetchTypes, updatePanneau } from '../../api/client';
import { ApiError } from '../../api/apiClient';
import FormModal from './FormModal';
import LocationField from './LocationField';
import TypePicker from './TypePicker';
import AuthorField, { useDefaultAuthor, rememberAuthor } from './AuthorField';
import './EditPanneauModal.css';

interface Props {
    panneau: Panneau | null;
    // Masquée (sans être fermée) pendant qu'on choisit une position sur la carte.
    isOpen: boolean;
    onClose: () => void;
    onPickLocation: () => void;
    pickedLocation?: { lat: number; lng: number } | null;
}

const FIELD_LABELS: Record<EditableField, string> = {
    position: 'position',
    comment: 'commentaire',
    types: 'types',
};

const formatEditDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });

const sameTypeIds = (a: number[], b: number[]): boolean =>
    a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

/**
 * Modification d'un panneau existant : position, types, commentaire.
 *
 * Volontairement non destructif — on ne peut ni supprimer le panneau ni ses
 * photos. Chaque modification est historisée côté serveur et l'historique est
 * affiché ici : tout le monde voit qui a touché à quoi, et une dégradation
 * reste réparable.
 */
const EditPanneauModal: React.FC<Props> = ({ panneau, isOpen, onClose, onPickLocation, pickedLocation }) => {
    const [comment, setComment] = useState('');
    const [typeIds, setTypeIds] = useState<number[]>([]);
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [author, setAuthor] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();
    const defaultAuthor = useDefaultAuthor();

    const { data: types = [] } = useQuery<PanelType[]>({
        queryKey: ['types'],
        queryFn: fetchTypes,
        enabled: Boolean(panneau),
    });

    const { data: history = [] } = useQuery({
        queryKey: ['panneauHistory', panneau?.id],
        queryFn: () => fetchPanneauHistory(panneau!.id),
        enabled: Boolean(panneau) && isOpen,
    });

    // Réinitialise le formulaire à chaque panneau ouvert — et après une
    // restauration, qui change l'état du panneau sous le formulaire.
    useEffect(() => {
        if (!panneau) return;
        setComment(panneau.comment ?? '');
        setTypeIds(panneau.typeIds);
        setPosition({ lat: panneau.lat, lng: panneau.lng });
        setErrorMsg('');
    }, [panneau]);

    useEffect(() => {
        if (panneau) setAuthor(defaultAuthor);
    }, [panneau, defaultAuthor]);

    useEffect(() => {
        if (pickedLocation) {
            setPosition(pickedLocation);
        }
    }, [pickedLocation]);

    const mutation = useMutation({
        mutationFn: () => {
            if (!panneau || !position) throw new Error('Panneau manquant');
            return updatePanneau(panneau.id, {
                lat: position.lat,
                lng: position.lng,
                comment,
                typeId: typeIds,
                author: author || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panneaux'] });
            queryClient.invalidateQueries({ queryKey: ['panneauHistory', panneau?.id] });
            rememberAuthor(author);
            onClose();
        },
        onError: (err) => {
            setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement. Réessayez.');
        },
    });

    if (!panneau || !isOpen) return null;

    const hasMoved = position !== null && (position.lat !== panneau.lat || position.lng !== panneau.lng);
    const hasChanges =
        hasMoved ||
        comment !== (panneau.comment ?? '') ||
        !sameTypeIds(typeIds, panneau.typeIds);

    return (
        <FormModal title="Modifier ce panneau" onClose={onClose} className="edit-panneau-card">
                <p className="edit-intro">
                    Corrigez une erreur de type, de position ou de description. Rien n'est supprimé :
                    chaque modification est enregistrée avec son auteur.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(''); mutation.mutate(); }}>
                    <LocationField
                        text={position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : 'Position inconnue'}
                        highlighted={hasMoved}
                    >
                        {hasMoved && (
                            <button
                                type="button"
                                className="btn-icon-undo"
                                onClick={() => setPosition({ lat: panneau.lat, lng: panneau.lng })}
                                title="Annuler le déplacement"
                                aria-label="Annuler le déplacement"
                            >
                                <Undo2 size={16} />
                            </button>
                        )}
                        <button type="button" className="btn-secondary" onClick={onPickLocation}>
                            Déplacer
                        </button>
                    </LocationField>

                    <div className="form-group">
                        <label>Types de panneau</label>
                        <TypePicker
                            types={types}
                            selectedTypeIds={typeIds}
                            onAdd={(id) => setTypeIds(prev => [...prev, id])}
                            onRemove={(id) => setTypeIds(prev => prev.filter(t => t !== id))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Commentaire</label>
                        <input
                            type="text"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Ex: Près de la mairie"
                        />
                    </div>

                    <AuthorField label="Modifié par" value={author} onChange={setAuthor} />

                    {errorMsg && <p className="edit-error">{errorMsg}</p>}

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={!hasChanges || typeIds.length === 0 || mutation.isPending}
                    >
                        {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </form>

                <div className="edit-history">
                    <h3><History size={14} /> Historique</h3>
                    <ul>
                        {history.map(revision => (
                            <li key={revision.id}>
                                <span className="edit-history-date">{formatEditDate(revision.createdAt)}</span>
                                <span className="edit-history-author">{revision.author || 'Anonyme'}</span>
                                <span className="edit-history-fields">
                                    {revision.restoredFrom
                                        ? 'restauration'
                                        : revision.fields.length === 0
                                            ? 'création'
                                            : revision.fields.map(field => FIELD_LABELS[field] ?? field).join(', ')}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
        </FormModal>
    );
};

export default EditPanneauModal;
