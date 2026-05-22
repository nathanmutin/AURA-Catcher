import React from 'react';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { photoUrl } from '../../api/client';
import './NearbyPanelsDialog.css';

type NearbyPanel = {
  id: number;
  imageIds: number[];
  comment?: string | null;
  author?: string | null;
};

interface NearbyPanelsDialogProps {
  nearbyPanels: Array<NearbyPanel & { distance: number }>;
  onAddPhoto: (panneauId: number) => void;
  onCreateNew: () => void;
  onPickDifferentLocation: () => void;
  isOpen: boolean;
}

const NearbyPanelsDialog: React.FC<NearbyPanelsDialogProps> = ({
  nearbyPanels,
  onAddPhoto,
  onCreateNew,
  onPickDifferentLocation,
  isOpen,
}) => {
  if (!isOpen || nearbyPanels.length === 0) {
    return null;
  }

  return (
    <div className="nearby-dialog-overlay">
      <div className="nearby-dialog-card">
        <div className="nearby-dialog-header">
          <div className="nearby-dialog-title-section">
            <AlertCircle size={24} className="nearby-dialog-icon" />
            <h3>Panneau existant détecté à proximité</h3>
          </div>
          <p className="nearby-dialog-subtitle">
            {nearbyPanels.length} panneau{nearbyPanels.length > 1 ? 'x' : ''} trouvé{nearbyPanels.length > 1 ? 's' : ''} à proximité. 
            Voulez-vous ajouter une photo à un panneau existant ou créer un nouveau ?
          </p>
        </div>

        <div className="nearby-panels-list">
          {nearbyPanels.map((panneau) => (
            <button
              key={panneau.id}
              type="button"
              className="nearby-panel-item"
              onClick={() => onAddPhoto(panneau.id)}
            >
              <div className="nearby-panel-image-container">
                {panneau.imageIds.length > 0 ? (
                  <img
                    src={photoUrl(panneau.imageIds[0])}
                    alt={`Panneau ${panneau.id}`}
                    className="nearby-panel-image"
                  />
                ) : (
                  <div className="nearby-panel-image-placeholder">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>

              <div className="nearby-panel-info">
                <div className="nearby-panel-distance">
                  <strong>{(panneau.distance).toFixed(0)}m</strong>
                  <span>à proximité</span>
                </div>
                <div className="nearby-panel-details">
                  <p className="nearby-panel-comment">
                    {panneau.comment ? `"${panneau.comment}"` : 'Pas de commentaire'}
                  </p>
                  <p className="nearby-panel-meta">
                    {panneau.imageIds.length} photo{panneau.imageIds.length > 1 ? 's' : ''} •{' '}
                    {panneau.author ? `par ${panneau.author}` : 'Anonyme'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="nearby-dialog-footer">
          <button className="btn-secondary" onClick={onPickDifferentLocation}>
            Choisir une autre localisation
          </button>
          <button className="btn-secondary" onClick={onCreateNew}>
            Créer un nouveau panneau
          </button>
        </div>
      </div>
    </div>
  );
};

export default NearbyPanelsDialog;
