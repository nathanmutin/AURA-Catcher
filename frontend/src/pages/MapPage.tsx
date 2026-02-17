import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Panneau } from '@aura-catcher/shared/api/types';
import { fetchPanneaux } from '../api/client';
import L from 'leaflet';
import { LocateControl } from "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { Plus } from 'lucide-react';
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

const MapUrlHandler = () => {
    const map = useMap();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const zoom = searchParams.get('zoom');

        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const zoomLevel = zoom ? parseInt(zoom) : 15;

            if (!isNaN(latitude) && !isNaN(longitude)) {
                map.setView([latitude, longitude], zoomLevel);
            }
        }
    }, [searchParams, map]);

    return null;
};

const PanneauMarker: React.FC<{ panneau: Panneau }> = ({ panneau }) => {
    const map = useMap();
    const [searchParams] = useSearchParams();
    const markerRef = useRef<L.Marker>(null);

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
            <Popup>
                <div className="popup-content">
                    <img src={panneau.imageUrl} alt="Panneau" className="popup-img" />
                    <p>{panneau.comment}</p>
                    <small>Par {panneau.author || 'Anonyme'}</small>
                </div>
            </Popup>
        </Marker>
    );
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
                    <PanneauMarker key={panneau.id} panneau={panneau} />
                ))}

                <MapEvents onMapClick={handleMapClick} isActive={isPickingLocation} />
                <LocationControl />
                <MapUrlHandler />
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
