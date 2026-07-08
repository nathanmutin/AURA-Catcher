import { useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

interface PickedLocationMarkerProps {
    location: { lat: number; lng: number } | null;
    isActive: boolean;
    onLocationChange: (location: { lat: number; lng: number }) => void;
}

const PickedLocationMarker: React.FC<PickedLocationMarkerProps> = ({ location, isActive, onLocationChange }) => {
    const map = useMap();

    useEffect(() => {
        if (!isActive || !location) {
            return;
        }

        map.flyTo([location.lat, location.lng], 15, {
            animate: true,
            duration: 0.6,
        });
    }, [isActive, location, map]);

    if (!isActive || !location) {
        return null;
    }

    const greyIcon = new L.Icon.Default({
        className: 'picked-location-marker-icon',
    });

    const handleDragEnd = (event: L.LeafletEvent) => {
        const marker = event.target as L.Marker;
        const { lat, lng } = marker.getLatLng();

        onLocationChange({ lat, lng });
    };

    return (
        <Marker
            position={[location.lat, location.lng]}
            icon={greyIcon}
            draggable
            eventHandlers={{
                dragend: handleDragEnd,
            }}
        />
    );
};

export default PickedLocationMarker;