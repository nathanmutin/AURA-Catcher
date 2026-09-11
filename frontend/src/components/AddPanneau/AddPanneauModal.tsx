import React from 'react';
import { Camera } from 'lucide-react';
import type { Panneau } from '@shared/types';
import { useAddPanneauForm, type ModalMode } from './useAddPanneauForm';
import NearbyPanelsDialog from './NearbyPanelsDialog';
import FormModal from '../PanelForm/FormModal';
import LocationField from '../PanelForm/LocationField';
import TypePicker from '../PanelForm/TypePicker';
import AuthorField from '../PanelForm/AuthorField';
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
                <FormModal title={isPhotoMode ? 'Ajouter une photo' : 'Ajouter un panneau'} onClose={handleClose}>
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
                            <LocationField
                                text={flow.location
                                    ? `Localisé : ${flow.location.lat.toFixed(4)}, ${flow.location.lng.toFixed(4)}`
                                    : 'Position manquante'}
                                highlighted={Boolean(flow.location)}
                            >
                                <button type="button" className="btn-secondary" onClick={() => onPickLocation?.()}>
                                    Choisir sur la carte
                                </button>
                            </LocationField>
                        )}

                        <AuthorField label="Auteur (pseudo)" value={author} onChange={setAuthor} />

                        {/* Type selector - only show in create mode */}
                        {!isPhotoMode && (
                            <div className="form-group">
                                <label>Types de panneau</label>
                                <TypePicker
                                    types={types}
                                    selectedTypeIds={typeIds}
                                    onAdd={addType}
                                    onRemove={removeType}
                                />
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
                </FormModal>
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
