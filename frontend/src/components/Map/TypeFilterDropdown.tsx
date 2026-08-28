import React, { useState } from 'react';
import type { PanelType } from '@shared/types';
import './TypeFilterDropdown.css';

interface Props {
    types: PanelType[];
    selectedTypeIds: number[];
    onToggleType: (id: number) => void;
    onToggleAll: () => void;
}

const TypeFilterDropdown: React.FC<Props> = ({ types, selectedTypeIds, onToggleType, onToggleAll }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="map-filter-container">
            <button
                className="filter-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                Filtres ({selectedTypeIds.length === types.length ? 'Tous' : selectedTypeIds.length})
            </button>

            {isOpen && (
                <div className="filter-dropdown">
                    <div
                        className="filter-dropdown-item select-all-item"
                        onClick={onToggleAll}
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
                                onClick={() => onToggleType(t.id)}
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
    );
};

export default TypeFilterDropdown;
