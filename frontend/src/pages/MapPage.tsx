import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Panneau } from '../../../backend/src/types';
import { fetchPanneaux, fetchTypes } from '../api/client';
import L from 'leaflet';
import { LocateControl } from "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { Plus, User, Calendar, Share2, Check } from 'lucide-react';
import AddPanneauModal from '../components/AddPanneau/AddPanneauModal.tsx';
import './MapPage.css';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface MapEventsProps {
    onMapClick: (latlng: L.LatLng) => void;
    isActive: boolean;
}

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick, isActive }) => {
    useMapEvents({
        click: (e) => {
            if (isActive) {
                onMapClick(e.latlng);
            }
        },
    });
    return null;
};

const LocationControl = () => {
    const map = useMap();

    useEffect(() => {
        const lc = new LocateControl({
            locateOptions: {
                enableHighAccuracy: true
            }
        });
        lc.addTo(map);
        // lc.start(); // Optional: if you want it to start automatically

        return () => {
            lc.remove();
        };
    }, [map]);

    return null;
};

const MapUrlHandler: React.FC<{ panneaux: Panneau[] }> = ({ panneaux }) => {
    const map = useMap();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const panneauId = searchParams.get('panneauId');

        if (panneauId && panneaux.length > 0) {
            const panneau = panneaux.find(p => p.id === Number(panneauId));
            if (panneau) {
                map.setView([panneau.lat, panneau.lng], 15);
                return;
            }
        }
    }, [searchParams, map, panneaux]);

    return null;
};

const PanneauMarker: React.FC<{ panneau: Panneau, typeName: string }> = ({ panneau, typeName }) => {
    const map = useMap();
    const [searchParams] = useSearchParams();
    const markerRef = useRef<L.Marker>(null);
    const [copied, setCopied] = useState(false);

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

    useEffect(() => {
        const idParam = searchParams.get('panneauId');
        if (idParam && Number(idParam) === panneau.id) {
            if (markerRef.current) {
                markerRef.current.openPopup();
            }
        }
    }, [searchParams, panneau.id]);

    return (
        <Marker
            ref={markerRef}
            position={[panneau.lat, panneau.lng]}
            eventHandlers={{
                click: () => {
                    const mapSize = map.getSize();
                    // To place the marker at 3/4 of the viewport height (near the bottom),
                    // we need the center of the map to be 1/4 of the viewport height ABOVE the marker.

                    const targetCenterPoint = map.latLngToContainerPoint([panneau.lat, panneau.lng]);
                    targetCenterPoint.y -= mapSize.y * 0.2;

                    const newCenter = map.containerPointToLatLng(targetCenterPoint);

                    map.flyTo(newCenter, map.getZoom());
                },
            }}
        >
            <Popup className="custom-popup">
                <div className="popup-content">
                    {panneau.imageUrl && (
                        <div className="popup-img-wrapper">
                            <img src={panneau.imageUrl} alt="Panneau AURA" className="popup-img" loading="lazy" />
                            <span className="popup-badge">{typeName}</span>
                        </div>
                    )}
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
                            <button className="popup-share-btn" onClick={handleShare} title="Partager ce panneau">
                                {copied ? <Check size={14} color="green" /> : <Share2 size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

const MapPage: React.FC = () => {
    const { data: panneaux = [] } = useQuery({ queryKey: ['panneaux'], queryFn: fetchPanneaux });
    const { data: types = [] } = useQuery({ queryKey: ['types'], queryFn: fetchTypes });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [hasInitializedFilter, setHasInitializedFilter] = useState(false);

    useEffect(() => {
        if (types.length > 0 && !hasInitializedFilter) {
            setSelectedTypeIds(types.map(t => t.id));
            setHasInitializedFilter(true);
        }
    }, [types, hasInitializedFilter]);

    const handleMapClick = (latlng: L.LatLng) => {
        setPickedLocation({ lat: latlng.lat, lng: latlng.lng });
        setIsPickingLocation(false);
        setIsModalOpen(true);
    };

    const startPickingLocation = () => {
        setIsModalOpen(false);
        setIsPickingLocation(true);
    };

    const handleSuccess = () => {
        // La mise à jour se fait via React Query dans AddPanneauModal
        // Could add toast here
    };

    const toggleType = (id: number) => {
        setSelectedTypeIds(prev =>
            prev.includes(id)
                ? prev.filter(tId => tId !== id)
                : [...prev, id]
        );
    };

    const toggleAllTypes = () => {
        if (selectedTypeIds.length === types.length) {
            setSelectedTypeIds([]); // deselect all
        } else {
            setSelectedTypeIds(types.map(t => t.id)); // select all
        }
    };

    const filteredPanneaux = panneaux.filter(p => selectedTypeIds.includes(p.typeId || 7)); // Defaulting missing typeId to Autre (7) if any

    return (
        <div className="map-page">
            <div className="map-filter-container">
                <button
                    className="filter-toggle-btn"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    Filtres ({selectedTypeIds.length === types.length ? 'Tous' : selectedTypeIds.length})
                </button>

                {isFilterOpen && (
                    <div className="filter-dropdown">
                        <div
                            className="filter-dropdown-item select-all-item"
                            onClick={toggleAllTypes}
                        >
                            <input
                                type="checkbox"
                                checked={selectedTypeIds.length === types.length}
                                readOnly
                            />
                            <strong>Tout sélectionner</strong>
                        </div>
                        {types.map(t => {
                            const isActive = selectedTypeIds.includes(t.id);
                            return (
                                <div
                                    key={t.id}
                                    className="filter-dropdown-item"
                                    onClick={() => toggleType(t.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        readOnly
                                    />
                                    <span>{t.name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <MapContainer
                center={[45.75, 4.85]}
                zoom={7}
                style={{ height: '100%', width: '100%', cursor: isPickingLocation ? 'crosshair' : 'grab' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredPanneaux.map((panneau) => {
                    const typeName = types.find(t => t.id === panneau.typeId)?.name || 'Inconnu';
                    return <PanneauMarker key={panneau.id} panneau={panneau} typeName={typeName} />;
                })}

                <MapEvents onMapClick={handleMapClick} isActive={isPickingLocation} />
                <LocationControl />
                <MapUrlHandler panneaux={panneaux} />
            </MapContainer>

            {/* FAB */}
            {!isPickingLocation && (
                <button className="fab-add" onClick={() => setIsModalOpen(true)}>
                    <Plus size={32} />
                </button>
            )}

            {/* Picking Instruction */}
            {isPickingLocation && (
                <div className="picking-instruction">
                    <p>Touchez la carte pour placer le panneau</p>
                    <button onClick={() => setIsPickingLocation(false)}>Annuler</button>
                </div>
            )}

            <AddPanneauModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPickLocation={startPickingLocation}
                pickedLocation={pickedLocation}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default MapPage;
