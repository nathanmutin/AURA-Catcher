import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { fetchPanneaux, fetchTypes } from '../api/client';
import L from 'leaflet';
import { LocateControl } from "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { Plus } from 'lucide-react';
import AddPanneauModal from '../components/AddPanneau/AddPanneauModal.tsx';
import PickedLocationMarker from '../components/AddPanneau/PickedLocationMarker.tsx';
import { PanneauMarker } from '../components/Marker/PanneauMarker.tsx';
import TypeFilterDropdown from '../components/Map/TypeFilterDropdown.tsx';
import { usePanelFilters } from '../components/Map/usePanelFilters.ts';
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
            },
            showPopup: false,
        });
        lc.addTo(map);

        return () => {
            lc.remove();
        };
    }, [map]);

    return null;
};

const MapPage: React.FC = () => {
    const { data: panneaux = [] } = useQuery({ queryKey: ['panneaux'], queryFn: fetchPanneaux });
    const { data: types = [] } = useQuery({ queryKey: ['types'], queryFn: fetchTypes });
    const [searchParams] = useSearchParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

    const locationSelectionTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (locationSelectionTimerRef.current !== null) {
                window.clearTimeout(locationSelectionTimerRef.current);
            }
        };
    }, []);

    const { selectedTypeIds, toggleType, toggleAllTypes, filteredPanneaux } = usePanelFilters(types, panneaux);

    const handleMapClick = (latlng: L.LatLng) => {
        setPickedLocation({ lat: latlng.lat, lng: latlng.lng });

        if (locationSelectionTimerRef.current !== null) {
            window.clearTimeout(locationSelectionTimerRef.current);
        }

        locationSelectionTimerRef.current = window.setTimeout(() => {
            setIsPickingLocation(false);
            setIsModalOpen(true);
            locationSelectionTimerRef.current = null;
        }, 300);
    };

    const startPickingLocation = () => {
        setIsModalOpen(false);
        setIsPickingLocation(true);
    };

    const handleSuccess = () => {
        // La mise à jour se fait via React Query dans AddPanneauModal
        // Could add toast here
    };

    // Récupération de l'ID du panneau sélectionné depuis les paramètres de l'URL
    // pour l'ouvrir automatiquement
    const selectedPanneauId = searchParams.get('panneauId') ? Number(searchParams.get('panneauId')) : null;

    return (
        <div className="map-page">
            <TypeFilterDropdown
                types={types}
                selectedTypeIds={selectedTypeIds}
                onToggleType={toggleType}
                onToggleAll={toggleAllTypes}
            />
            <MapContainer
                center={[45.75, 4.85]}
                zoom={7}
                style={{ height: '100%', width: '100%', cursor: isPickingLocation ? 'crosshair' : 'grab' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                <MarkerClusterGroup
                  maxClusterRadius={40}
                  spiderfyOnMaxZoom={true}
                  zoomToBoundsOnClick={true}
                  showCoverageOnHover={false}
                  chunkedLoading={true}
                  chunkInterval={200}
                  chunkDelay={50}
                >
                    {filteredPanneaux.map((panneau) => {
                        const isSelected = panneau.id === selectedPanneauId;
                        return <PanneauMarker key={panneau.id} panneau={panneau} types={types} isSelected={isSelected} />;
                    })}
                </MarkerClusterGroup>

                <MapEvents onMapClick={handleMapClick} isActive={isPickingLocation} />
                <LocationControl />
                <PickedLocationMarker
                    location={pickedLocation}
                    isActive={isPickingLocation}
                    onLocationChange={setPickedLocation}
                />
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
                    <p>
                        Touchez la carte pour placer le panneau
                        {pickedLocation && (
                            <>
                                <br />
                                Position actuelle : {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)}
                            </>
                        )}
                    </p>
                    <button onClick={() => setIsPickingLocation(false)}>Annuler</button>
                </div>
            )}

            <AddPanneauModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPickLocation={startPickingLocation}
                pickedLocation={pickedLocation}
                setPickedLocation={setPickedLocation}
                onResetLocation={() => {
                    setPickedLocation(null);
                    setIsPickingLocation(false);
                }}
                onSuccess={handleSuccess}
                panneaux={panneaux}
            />
        </div>
    );
};

export default MapPage;
