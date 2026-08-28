import { useEffect, useState } from 'react';
import type { PanelType, Panneau } from '../../../../backend/src/types';

export function usePanelFilters(types: PanelType[], panneaux: Panneau[]) {
    const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Tous les types sont sélectionnés par défaut, dès qu'ils sont chargés.
    useEffect(() => {
        if (types.length > 0 && !hasInitialized) {
            setSelectedTypeIds(types.map(t => t.id));
            setHasInitialized(true);
        }
    }, [types, hasInitialized]);

    const toggleType = (id: number) => {
        setSelectedTypeIds(prev =>
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    const toggleAllTypes = () => {
        setSelectedTypeIds(prev => (prev.length === types.length ? [] : types.map(t => t.id)));
    };

    const filteredPanneaux = panneaux.filter(p => p.typeIds.some(tid => selectedTypeIds.includes(tid)));

    return { selectedTypeIds, toggleType, toggleAllTypes, filteredPanneaux };
}
