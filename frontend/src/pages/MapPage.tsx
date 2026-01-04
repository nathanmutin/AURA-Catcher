import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Panneau } from '../../../backend/src/types.ts';
import { fetchPanneaux } from '../api/client';
import L from 'leaflet';
import { Plus } from 'lucide-react';
import AddPanneauModal from '../components/AddPanneau/AddPanneauModal.tsx';
import './MapPage.css';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const BASE_URL = import.meta.env.VITE_API_URL || '';

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

const MapPage: React.FC = () => {
    const [panneaux, setPanneaux] = useState<Panneau[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);



    useEffect(() => {
        const loadPanneaux = async () => {
            try {
                const data = await fetchPanneaux();
                setPanneaux(data);
            } catch (error) {
                console.error('Failed to load panneaux:', error);
            }
        };
        loadPanneaux();
    }, []);

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
        // Reload locally for now
        fetchPanneaux().then(setPanneaux).catch(console.error);
        // Could add toast here
    };

    return (
        <div className="map-page">
            <MapContainer
                center={[45.75, 4.85]}
                zoom={7}
                style={{ height: '100%', width: '100%', cursor: isPickingLocation ? 'crosshair' : 'grab' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {panneaux.map((panneau) => (
                    <Marker key={panneau.id} position={[panneau.lat, panneau.lng]}>
                        <Popup>
                            <div className="popup-content">
                                <img src={BASE_URL+panneau.imageUrl} alt="Panneau" className="popup-img" />
                                <p>{panneau.comment}</p>
                                <small>Par {panneau.author || 'Anonyme'}</small>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapEvents onMapClick={handleMapClick} isActive={isPickingLocation} />
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
