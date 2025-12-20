import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, X } from 'lucide-react';
import { getGPSFromImage } from '../../utils/geo';
import { createPanneau } from '../../api/client';
import './AddPanneauModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onPickLocation: () => void;
    pickedLocation: { lat: number; lng: number } | null;
    onSuccess: () => void;
}

const AddPanneauModal: React.FC<Props> = ({ isOpen, onClose, onPickLocation, pickedLocation, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [author, setAuthor] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (pickedLocation) {
            setLocation(pickedLocation);
        }
    }, [pickedLocation]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));

            const gps = await getGPSFromImage(selectedFile);
            if (gps) {
                setLocation(gps);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !location) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
        formData.append('comment', comment);
        formData.append('author', author);

        try {
            await createPanneau(formData);
            onSuccess();
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        setLocation(null);
        setComment('');
        setAuthor('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <button className="close-btn" onClick={handleClose}><X /></button>

                <h2>Ajouter un panneau</h2>

                <form onSubmit={handleSubmit}>
                    {/* Image Upload Area */}
                    <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                        {preview ? (
                            <img src={preview} alt="Preview" className="upload-preview" />
                        ) : (
                            <div className="upload-placeholder">
                                <Camera size={48} color="var(--aura-blue)" />
                                <p>Prendre une photo ou importer</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            hidden
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Location Status */}
                    <div className="location-section">
                        <div className="location-status">
                            <MapPin size={20} className={location ? 'text-green' : 'text-gray'} />
                            <span>
                                {location
                                    ? `Localisé : ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                                    : 'Position manquante'}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                                // If we pick location, we must preserve the file state when reopening
                                // For MVP, we assume MapPage holds the state or we pass it up?
                                // Actually, if we close modal, we lose state unless parent holds it.
                                // Parent should hold state or we just hide this modal with CSS.
                                onPickLocation();
                            }}
                        >
                            Choisir sur la carte
                        </button>
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

                    <div className="form-group">
                        <label>Auteur</label>
                        <input
                            type="text"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            placeholder="Votre nom/pseudo"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={!file || !location || loading}
                    >
                        {loading ? 'Envoi...' : 'Envoyer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPanneauModal;
