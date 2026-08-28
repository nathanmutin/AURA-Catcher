import React from 'react';
import { Camera, MapPin, X } from 'lucide-react';
import type { Panneau } from '@shared/types';
import { useAddPanneauForm, type ModalMode } from './useAddPanneauForm';
import NearbyPanelsDialog from './NearbyPanelsDialog';
import './AddPanneauModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onPickLocation?: () => void;
    pickedLocation?: { lat: number; lng: number } | null;
    setPickedLocation?: (location: { lat: number; lng: number } | null) => void;
    onResetLocation?: () => void;
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
    setPickedLocation,
    onResetLocation,
    onSuccess,
    mode = 'create',
    panneauId,
    panneaux = []
}) => {
    const {
        flow,
        file,
        preview,
        comment,
        setComment,
        author,
        setAuthor,
        typeIds,
        addType,
        removeType,
        isAddingType,
        setIsAddingType,
        types,
        isPhotoMode,
        isLoading,
        fileInputRef,
        handleFileChange,
        handleSubmit,
        handleClose,
        handleAddPhotoToExisting,
        handleCreateNewAnyway,
        handlePickDifferentLocation,
    } = useAddPanneauForm({
        isOpen,
        mode,
        panneauId,
        panneaux,
        pickedLocation,
        setPickedLocation,
        onPickLocation,
        onResetLocation,
        onSuccess,
        onClose,
    });

    if (!isOpen) return null;

    return (
        <>
            {flow.mode !== 'nearbySelection' && (
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
                                    <MapPin size={20} className={flow.location ? 'text-green' : 'text-gray'} />
                                    <span>
                                        {flow.location
                                            ? `Localisé : ${flow.location.lat.toFixed(4)}, ${flow.location.lng.toFixed(4)}`
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
                                <label>Types de panneau</label>
                                <div className="selected-types">
                                    {typeIds.map(tid => {
                                        const type = types.find(t => t.id === tid);
                                        return type ? (
                                            <span key={type.id} className="type-badge">
                                                {type.name}
                                                <button type="button" onClick={() => removeType(type.id)}>
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                    {isAddingType ? (
                                        <div
                                            className="add-type-dropdown"
                                            tabIndex={0}
                                            onBlur={() => setIsAddingType(false)}
                                        >
                                            {types
                                                .filter(t => !typeIds.includes(t.id))
                                                .map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        className="add-type-option"
                                                        onMouseDown={e => {
                                                            // prevent blur before click
                                                            e.preventDefault();
                                                            addType(t.id);
                                                            setIsAddingType(false);
                                                        }}
                                                    >
                                                        {t.name} ({t.points} pts)
                                                    </button>
                                                ))}
                                            {types.filter(t => !typeIds.includes(t.id)).length === 0 && (
                                                <div className="no-types">Aucun type disponible</div>
                                            )}
                                        </div>
                                    ) : (
                                        <button type="button" className="type-badge add-type-btn" onClick={() => setIsAddingType(true)}>
                                            +
                                        </button>
                                    )}
                                </div>
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
                            disabled={isPhotoMode ? !file || isLoading : (!file || !flow.location || isLoading)}
                        >
                            {isLoading ? 'Envoi...' : (isPhotoMode ? 'Ajouter la photo' : 'Envoyer')}
                        </button>
                    </form>
                </div>
            </div>
            )}

            <NearbyPanelsDialog
                nearbyPanels={flow.nearbyPanels}
                onAddPhoto={handleAddPhotoToExisting}
                onCreateNew={handleCreateNewAnyway}
                onPickDifferentLocation={handlePickDifferentLocation}
                onClose={handleClose}
                isOpen={flow.mode === 'nearbySelection' && flow.nearbyPanels.length > 0}
            />
        </>
    );
};

export default AddPanneauModal;
