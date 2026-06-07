import { useEffect, useState } from 'react';
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
import { PanneauMarker } from '../components/Marker/PanneauMarker.tsx';
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
    const selectedPanneauId = searchParams.get('panneauId') ? Number(searchParams.get('panneauId')) : null;

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

                <MarkerClusterGroup
                  disableClusteringAtZoom={14}
                  maxClusterRadius={40}
                  spiderfyOnMaxZoom={true}
                  zoomToBoundsOnClick={true}
                  showCoverageOnHover={false}
                  chunkedLoading={true}
                  chunkInterval={200}
                  chunkDelay={50}
                >
                    {filteredPanneaux.map((panneau) => {
                        const typeName = types.find(t => t.id === panneau.typeId)?.name || 'Inconnu';
                        const isSelected = panneau.id === selectedPanneauId;
                        return <PanneauMarker key={panneau.id} panneau={panneau} typeName={typeName} isSelected={isSelected} />;
                    })}
                </MarkerClusterGroup>

                <MapEvents onMapClick={handleMapClick} isActive={isPickingLocation} />
                <LocationControl />
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
                panneaux={panneaux}
            />
        </div>
    );
};

export default MapPage;
