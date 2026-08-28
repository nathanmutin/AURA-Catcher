import { useEffect, useReducer, useRef, useState } from 'react';
import type React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { handleHEIC, getGPSFromImage } from '../../utils/photos';
import { createPanneau, fetchTypes, uploadPhotoToPanel } from '../../api/client';
import { STORAGE_KEYS } from '../../utils/constants';
import { getNearbyPanels } from '../../utils/distanceUtils';
import type { Panneau } from '@shared/types';

export type ModalMode = 'create' | 'addPhoto' | 'nearbySelection';

type Location = { lat: number; lng: number };

interface FlowState {
    mode: ModalMode;
    panneauId: number | undefined;
    location: Location | null;
    nearbyPanels: Array<Panneau & { distance: number }>;
    skipNearbyCheck: boolean;
}

type FlowAction =
    | { type: 'RESET'; mode: ModalMode; panneauId: number | undefined }
    | { type: 'LOCATION_PICKED'; location: Location }
    | { type: 'NEARBY_PANELS_FOUND'; nearbyPanels: Array<Panneau & { distance: number }> }
    | { type: 'NEARBY_PANELS_CLEARED' }
    | { type: 'ADD_PHOTO_TO_EXISTING'; panneauId: number }
    | { type: 'CREATE_NEW_ANYWAY' }
    | { type: 'PICK_DIFFERENT_LOCATION' };

function initFlowState(mode: ModalMode, panneauId: number | undefined): FlowState {
    return { mode, panneauId, location: null, nearbyPanels: [], skipNearbyCheck: false };
}

// Centralise les transitions entre les 3 modes du formulaire (create / addPhoto /
// nearbySelection). Auparavant piloté par une chaîne de useEffect qui se
// déclenchaient en cascade (location -> nearby panels -> mode), ce qui rendait
// difficile de savoir pourquoi on se retrouvait dans tel ou tel mode. Ici,
// chaque transition est une action explicite et le nouvel état est calculé à
// un seul endroit.
function flowReducer(state: FlowState, action: FlowAction): FlowState {
    switch (action.type) {
        case 'RESET':
            return initFlowState(action.mode, action.panneauId);
        case 'LOCATION_PICKED':
            return { ...state, location: action.location };
        case 'NEARBY_PANELS_FOUND':
            return { ...state, mode: 'nearbySelection', nearbyPanels: action.nearbyPanels };
        case 'NEARBY_PANELS_CLEARED':
            return {
                ...state,
                mode: state.mode === 'nearbySelection' ? 'create' : state.mode,
                nearbyPanels: [],
            };
        case 'ADD_PHOTO_TO_EXISTING':
            return { ...state, mode: 'addPhoto', panneauId: action.panneauId, location: null, nearbyPanels: [] };
        case 'CREATE_NEW_ANYWAY':
            return { ...state, mode: 'create', skipNearbyCheck: true, nearbyPanels: [] };
        case 'PICK_DIFFERENT_LOCATION':
            return { ...state, mode: 'create', location: null, nearbyPanels: [], skipNearbyCheck: false };
        default:
            return state;
    }
}

interface UseAddPanneauFormOptions {
    isOpen: boolean;
    mode: ModalMode;
    panneauId?: number;
    panneaux: Panneau[];
    pickedLocation?: Location | null;
    setPickedLocation?: (location: Location | null) => void;
    onPickLocation?: () => void;
    onResetLocation?: () => void;
    onSuccess: () => void;
    onClose: () => void;
}

export function useAddPanneauForm({
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
}: UseAddPanneauFormOptions) {
    const [flow, dispatch] = useReducer(flowReducer, initFlowState(mode, panneauId));
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [author, setAuthor] = useState('');
    const [typeIds, setTypeIds] = useState<number[]>([]);
    const [isAddingType, setIsAddingType] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: types = [] } = useQuery({
        queryKey: ['types'],
        queryFn: fetchTypes,
        enabled: isOpen && flow.mode === 'create',
    });

    useEffect(() => {
        if (isOpen) {
            const savedAuthor = localStorage.getItem(STORAGE_KEYS.LAST_AUTHOR);
            if (savedAuthor) {
                setAuthor(savedAuthor);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (pickedLocation) {
            dispatch({ type: 'LOCATION_PICKED', location: pickedLocation });
        }
    }, [pickedLocation]);

    // Détecte les panneaux à proximité dès qu'une localisation est choisie ;
    // le résultat (trouvé / rien à proximité) est traduit en une seule action.
    useEffect(() => {
        if (flow.mode === 'addPhoto' || !flow.location || panneaux.length === 0 || flow.skipNearbyCheck) {
            return;
        }

        const nearby = getNearbyPanels(flow.location, panneaux);
        if (nearby.length > 0) {
            dispatch({ type: 'NEARBY_PANELS_FOUND', nearbyPanels: nearby });
        } else if (flow.nearbyPanels.length > 0) {
            dispatch({ type: 'NEARBY_PANELS_CLEARED' });
        }
    }, [flow.location, flow.mode, flow.skipNearbyCheck, flow.nearbyPanels.length, panneaux]);

    const createPanneauMutation = useMutation({
        mutationFn: (formData: FormData) => createPanneau(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panneaux'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            onSuccess();
            handleClose();
        },
        onError: (err) => {
            console.error(err);
            alert('Erreur lors de l\'envoi');
        }
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: (formData: FormData) => {
            if (!flow.panneauId) throw new Error('Panel ID required');
            return uploadPhotoToPanel(flow.panneauId, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panneaux'] });
            onSuccess();
            handleClose();
        },
        onError: (err) => {
            console.error(err);
            alert('Erreur lors de l\'envoi');
        }
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const originalFile = e.target.files[0];
        const fileToUpload = await handleHEIC(originalFile);

        setFile(fileToUpload);
        setPreview(URL.createObjectURL(fileToUpload));

        if (flow.mode === 'create') {
            // Utilise le fichier original pour préserver les données EXIF.
            const gps = await getGPSFromImage(originalFile);
            if (gps) {
                dispatch({ type: 'LOCATION_PICKED', location: gps });
                setPickedLocation?.(gps);
            }
        }
    };

    const handleClose = () => {
        dispatch({ type: 'RESET', mode, panneauId });
        setFile(null);
        setPreview(null);
        setComment('');
        setTypeIds([]);
        onResetLocation?.();
        onClose();
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (flow.mode === 'addPhoto') {
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);
            if (author) {
                formData.append('author', author);
                localStorage.setItem(STORAGE_KEYS.LAST_AUTHOR, author);
            }

            uploadPhotoMutation.mutate(formData);
        } else {
            if (!file || !flow.location) return;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('lat', flow.location.lat.toString());
            formData.append('lng', flow.location.lng.toString());
            formData.append('comment', comment);
            if (author) {
                formData.append('author', author);
                localStorage.setItem(STORAGE_KEYS.LAST_AUTHOR, author);
            }
            typeIds.forEach(tid => formData.append('typeId', tid.toString()));

            createPanneauMutation.mutate(formData);
        }
    };

    const handleAddPhotoToExisting = (selectedPanneauId: number) => {
        dispatch({ type: 'ADD_PHOTO_TO_EXISTING', panneauId: selectedPanneauId });
    };

    const handleCreateNewAnyway = () => {
        dispatch({ type: 'CREATE_NEW_ANYWAY' });
    };

    const handlePickDifferentLocation = () => {
        dispatch({ type: 'PICK_DIFFERENT_LOCATION' });
        onPickLocation?.();
    };

    const addType = (id: number) => setTypeIds(prev => [...prev, id]);
    const removeType = (id: number) => setTypeIds(prev => prev.filter(t => t !== id));

    const isPhotoMode = flow.mode === 'addPhoto';
    const isLoading = isPhotoMode ? uploadPhotoMutation.isPending : createPanneauMutation.isPending;

    return {
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
    };
}
