import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import './PhotoField.css';

interface Props {
    // URL d'aperçu du fichier choisi (null tant qu'il n'y en a pas).
    preview: string | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    // Le formulaire d'ajout de panneau garde sa propre référence sur l'input
    // (elle vit dans son hook) ; sinon le champ gère la sienne.
    inputRef?: React.RefObject<HTMLInputElement | null>;
    placeholder?: string;
}

/**
 * Zone de choix de photo : aperçu une fois le fichier choisi, invitation
 * sinon. Toute la surface est cliquable et déclenche l'input, resté caché.
 */
const PhotoField: React.FC<Props> = ({ preview, onChange, inputRef, placeholder = 'Prendre une photo ou importer' }) => {
    const ownRef = useRef<HTMLInputElement>(null);
    const ref = inputRef ?? ownRef;

    return (
        <div className="upload-area" onClick={() => ref.current?.click()}>
            {preview ? (
                <img src={preview} alt="Aperçu de la photo choisie" className="upload-preview" />
            ) : (
                <div className="upload-placeholder">
                    <Camera size={48} color="var(--aura-blue)" />
                    <p>{placeholder}</p>
                </div>
            )}
            <input
                type="file"
                accept="image/*"
                ref={ref}
                hidden
                onChange={onChange}
            />
        </div>
    );
};

export default PhotoField;
