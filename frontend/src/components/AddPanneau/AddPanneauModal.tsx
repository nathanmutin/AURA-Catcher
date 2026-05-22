import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Camera, MapPin, X } from 'lucide-react';
import { handleHEIC, getGPSFromImage } from '../../utils/photos';
import { createPanneau, fetchTypes, uploadPhotoToPanel } from '../../api/client';
import { STORAGE_KEYS } from '../../utils/constants';
import { getNearbyPanels } from '../../utils/distanceUtils';
import type { Panneau } from '../../../../backend/src/types';
import NearbyPanelsDialog from './NearbyPanelsDialog';
import './AddPanneauModal.css';

type ModalMode = 'create' | 'addPhoto' | 'nearbySelection';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onPickLocation?: () => void;
    pickedLocation?: { lat: number; lng: number } | null;
    onSuccess: () => void;
    mode?: ModalMode;
    panneauId?: number;
    panneaux?: Panneau[];
}

const AddPanneauModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    onPickLocation, 
    pickedLocation, 
    onSuccess, 
    mode = 'create',
    panneauId,
    panneaux = []
}) => {
    const [modeInternal, setModeInternal] = useState<ModalMode>(mode);
    const [panneauIdInternal, setPanneauIdInternal] = useState<number | undefined>(panneauId);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [comment, setComment] = useState('');
    const [author, setAuthor] = useState('');
    const [typeId, setTypeId] = useState<number | ''>('');
    const [skipNearbyCheck, setSkipNearbyCheck] = useState(false);
    const [nearbyPanels, setNearbyPanels] = useState<Array<Panneau & { distance: number }>>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: types = [] } = useQuery({ queryKey: ['types'], queryFn: fetchTypes, enabled: isOpen && modeInternal === 'create' });

    useEffect(() => {
        if (isOpen) {
            const savedAuthor = localStorage.getItem(STORAGE_KEYS.LAST_AUTHOR);
            if (savedAuthor) {
                setAuthor(savedAuthor);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (modeInternal === 'create' && types.length > 0 && typeId === '') {
            setTypeId(types[0].id);
        }
    }, [types, typeId, modeInternal]);

    useEffect(() => {
        if (pickedLocation) {
            setLocation(pickedLocation);
        }
    }, [pickedLocation]);

    // Check for nearby panels when location is updated
    useEffect(() => {
        if (modeInternal === 'create' && location && panneaux.length > 0 && !skipNearbyCheck) {
            const nearby = getNearbyPanels(location, panneaux);
            if (nearby.length > 0) {
                setNearbyPanels(nearby);
                setModeInternal('nearbySelection');
            } else {
                // Clear nearby panels if none found
                setNearbyPanels([]);
                setModeInternal('create');
            }
        }
    }, [location, modeInternal, panneaux, skipNearbyCheck]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const originalFile = e.target.files[0];
            let fileToUpload = await handleHEIC(originalFile);

            setFile(fileToUpload);
            setPreview(URL.createObjectURL(fileToUpload));

            // Only extract GPS for create mode
            if (modeInternal === 'create') {
                // Use original file for GPS to preserve EXIF data
                const gps = await getGPSFromImage(originalFile);
                if (gps) {
                    setLocation(gps);
                }
            }
        }
    };

    const createPanneauMutation = useMutation({
        mutationFn: (formData: FormData) => createPanneau(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panneaux'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            onSuccess();
            handleClose();
        },
        onError: (err) => {
            console.error(err);
            alert('Erreur lors de l\'envoi');
        }
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: (formData: FormData) => {
            if (!panneauIdInternal) throw new Error('Panel ID required');
            return uploadPhotoToPanel(panneauIdInternal, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panneaux'] });
            onSuccess();
            handleClose();
        },
        onError: (err) => {
            console.error(err);
            alert('Erreur lors de l\'envoi');
        }
    });

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (modeInternal === 'addPhoto') {
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);
            if (author) {
                formData.append('author', author);
                localStorage.setItem(STORAGE_KEYS.LAST_AUTHOR, author);
            }

            uploadPhotoMutation.mutate(formData);
        } else {
            // modeInternal === 'create'
            if (!file || !location) return;

            // No nearby panels, proceed with creation
            const formData = new FormData();
            formData.append('image', file);
            formData.append('lat', location.lat.toString());
            formData.append('lng', location.lng.toString());
            formData.append('comment', comment);
            if (author) {
                formData.append('author', author);
                localStorage.setItem(STORAGE_KEYS.LAST_AUTHOR, author);
            }
            if (typeId) {
                formData.append('typeId', typeId.toString());
            }

            createPanneauMutation.mutate(formData);
        }
    };

    const handleClose = () => {
        setModeInternal(mode);
        setPanneauIdInternal(panneauId);
        setFile(null);
        setPreview(null);
        setLocation(null);
        setComment('');
        setSkipNearbyCheck(false);
        setNearbyPanels([]);
        onClose();
    };

    const handleAddPhotoToExisting = (selectedPanneauId: number) => {
        // Close nearby dialog
        setLocation(null);
        setNearbyPanels([]);
        setModeInternal('addPhoto');
        setPanneauIdInternal(selectedPanneauId);
    };

    const handleCreateNewAnyway = () => {
        // Close nearby dialog and continue with form
        setNearbyPanels([]);
        setSkipNearbyCheck(true);
        setModeInternal('create');
        // Keep location and file, user can now submit form
    };

    const handlePickDifferentLocation = () => {
        // Close dialog and clear location, user can pick again
        setLocation(null);
        setNearbyPanels([]);
        setSkipNearbyCheck(false);
        setModeInternal('create');
        // Trigger location picker
        onPickLocation?.();
    };

    if (!isOpen) return null;

    const isLoading = modeInternal === 'create' ? createPanneauMutation.isPending : uploadPhotoMutation.isPending;
    const isPhotoMode = modeInternal === 'addPhoto';

    return (
        <>
            {modeInternal !== 'nearbySelection' && (
            <div className="modal-overlay">
                <div className="modal-card">
                    <button className="close-btn" onClick={handleClose}><X /></button>

                    <h2>{isPhotoMode ? 'Ajouter une photo' : 'Ajouter un panneau'}</h2>

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

                        {/* Location Status - only show in create mode */}
                        {!isPhotoMode && (
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
                                        onPickLocation?.();
                                    }}
                                >
                                    Choisir sur la carte
                                </button>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Auteur (pseudo)</label>
                            <input
                                type="text"
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                placeholder="Votre pseudo"
                            />
                        </div>

                        {/* Type selector - only show in create mode */}
                        {!isPhotoMode && (
                            <div className="form-group">
                                <label>Type de panneau</label>
                                <select
                                    value={typeId}
                                    onChange={e => setTypeId(Number(e.target.value))}
                                    required
                                >
                                    {types.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.points} pts)</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Comment - only show in create mode */}
                        {!isPhotoMode && (
                            <div className="form-group">
                                <label>Commentaire</label>
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Ex: Près de la mairie"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={isPhotoMode ? !file || isLoading : (!file || !location || isLoading)}
                        >
                            {isLoading ? 'Envoi...' : (isPhotoMode ? 'Ajouter la photo' : 'Envoyer')}
                        </button>
                    </form>
                </div>
            </div>
            )}

            <NearbyPanelsDialog
                nearbyPanels={nearbyPanels}
                onAddPhoto={handleAddPhotoToExisting}
                onCreateNew={handleCreateNewAnyway}
                onPickDifferentLocation={handlePickDifferentLocation}
                isOpen={modeInternal === 'nearbySelection' && nearbyPanels.length > 0}
            />
        </>
    );
};

export default AddPanneauModal;
