import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GaleriePhoto } from '@shared/types';
import { createGaleriePhoto } from '../../api/client';
import { ApiError } from '../../api/apiClient';
import { handleHEIC } from '../../utils/photos';
import FormModal from '../PanelForm/FormModal';
import PhotoField from '../PanelForm/PhotoField';
import AuthorField, { useDefaultAuthor, rememberAuthor } from '../PanelForm/AuthorField';
import './Galerie.css';

interface Props {
    onClose: () => void;
    onSuccess: (photo: GaleriePhoto) => void;
}

/**
 * Ajout d'une photo à la galerie des logos : un fichier, une légende facultative,
 * un pseudo. Pas de position — c'est tout ce qui distingue ce formulaire de
 * celui des panneaux, et c'est voulu : ces supports se déplacent.
 */
const AddGaleriePhotoModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const defaultAuthor = useDefaultAuthor();
    const [author, setAuthor] = useState(defaultAuthor);
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => {
            const formData = new FormData();
            formData.append('image', file!);
            if (caption) formData.append('caption', caption);
            if (author) formData.append('author', author);
            return createGaleriePhoto(formData);
        },
        onSuccess: (photo) => {
            queryClient.invalidateQueries({ queryKey: ['galerie'] });
            rememberAuthor(author);
            onSuccess(photo);
        },
        onError: (err) => {
            setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de l\'envoi. Réessayez.');
        },
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const chosen = event.target.files?.[0];
        if (!chosen) return;

        // Les photos d'iPhone arrivent en HEIC, que les navigateurs ne savent
        // pas afficher : même conversion que pour les panneaux.
        const converted = await handleHEIC(chosen);
        setFile(converted);
        setPreview(URL.createObjectURL(converted));
    };

    return (
        <FormModal title="Ajouter un objet" onClose={onClose}>
            <p className="galerie-modal-intro">
                Un objet aux couleurs de la Région : un train, un car, un gobelet… Tout ce qui n'a pas de place fixe.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setErrorMsg(''); mutation.mutate(); }}>
                <PhotoField preview={preview} onChange={handleFileChange} />

                <div className="form-group">
                    <label>Légende</label>
                    <input
                        type="text"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="Ex: TER floqué, gare de Valence"
                    />
                </div>

                <AuthorField label="Ajouté par" value={author} onChange={setAuthor} />

                {errorMsg && <p className="galerie-error">{errorMsg}</p>}

                <button type="submit" className="btn-primary w-full" disabled={!file || mutation.isPending}>
                    {mutation.isPending ? 'Envoi...' : 'Publier'}
                </button>
            </form>
        </FormModal>
    );
};

export default AddGaleriePhotoModal;
