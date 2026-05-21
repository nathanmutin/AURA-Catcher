import React, { useEffect, useState, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { User, Calendar, Share2, Check, ImagePlus } from 'lucide-react';
import type { Panneau } from '../../../../backend/src/types';
import { photoUrl } from '../../api/client';
import { PhotoCarousel } from './PhotoCarousel';
import AddPanneauModal from '../AddPanneau/AddPanneauModal';
import '../../pages/MapPage.css';

interface PanneauMarkerProps {
    panneau: Panneau;
    typeName: string;
    isSelected?: boolean;
}

export const PanneauMarker: React.FC<PanneauMarkerProps> = ({ panneau, typeName, isSelected = false }) => {
    const map = useMap();
    const markerRef = useRef<L.Marker>(null);
    const [copied, setCopied] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [imageCount, setImageCount] = useState(panneau.imageCount);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/?panneauId=${panneau.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'AURA Catcher',
                text: `Regarde ce magnifique panneau de la Région : ${panneau.comment || ''}`,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleUploadSuccess = () => {
        setImageCount(imageCount + 1);
        setIsUploadModalOpen(false);
    };

    useEffect(() => {
        if (isSelected && markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [isSelected]);

    return (
        <>
            <Marker
                ref={markerRef}
                position={[panneau.lat, panneau.lng]}
                eventHandlers={{
                    click: () => {
                        const mapSize = map.getSize();
                        const targetCenterPoint = map.latLngToContainerPoint([panneau.lat, panneau.lng]);
                        targetCenterPoint.y -= mapSize.y * 0.2;

                        const newCenter = map.containerPointToLatLng(targetCenterPoint);

                        map.flyTo(newCenter, map.getZoom());
                    },
                }}
            >
                <Popup className="custom-popup">
                    <div className="popup-content">
                        <div className="popup-img-wrapper">
                            <PhotoCarousel
                                photoUrl={(index) => photoUrl(panneau.id, index)}
                                imageCount={imageCount}
                                alt="Panneau AURA"
                            />
                            <span className="popup-badge">{typeName}</span>
                        </div>
                        <div className="popup-details">
                            {panneau.comment ? (
                                <p className="popup-comment">"{panneau.comment}"</p>
                            ) : (
                                <p className="popup-comment empty-comment">Aucun commentaire</p>
                            )}
                            <div className="popup-footer">
                                <div className="popup-author-date">
                                    <span className="popup-author">
                                        <User size={12} className="popup-icon" /> {panneau.author || 'Anonyme'}
                                    </span>
                                    <span className="popup-date">
                                        <Calendar size={12} className="popup-icon" /> {new Date(panneau.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="popup-actions">
                                    <button 
                                        className="popup-add-photo-btn" 
                                        onClick={() => setIsUploadModalOpen(true)} 
                                        title="Ajouter une photo"
                                        aria-label="Ajouter une photo"
                                    >
                                        <ImagePlus size={18} />
                                    </button>
                                    <button className="popup-share-btn" onClick={handleShare} title="Partager ce panneau">
                                        {copied ? <Check size={18} color="green" /> : <Share2 size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Popup>
            </Marker>

            <AddPanneauModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
                mode="addPhoto"
                panneauId={panneau.id}
            />
        </>
    );
};
