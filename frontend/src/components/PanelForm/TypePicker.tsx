import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { PanelType } from '@shared/types';
import './TypePicker.css';

interface Props {
    types: PanelType[];
    selectedTypeIds: number[];
    onAdd: (typeId: number) => void;
    onRemove: (typeId: number) => void;
}

// Sélecteur de types de panneau, partagé entre l'ajout et la modification
// d'un panneau : badges retirables + menu déroulant maison pour en ajouter.
const TypePicker: React.FC<Props> = ({ types, selectedTypeIds, onAdd, onRemove }) => {
    const [isAdding, setIsAdding] = useState(false);
    const available = types.filter(type => !selectedTypeIds.includes(type.id));

    return (
        <div className="selected-types">
            {selectedTypeIds.map(typeId => {
                const type = types.find(t => t.id === typeId);
                return type ? (
                    <span key={type.id} className="type-badge">
                        {type.name}
                        <button type="button" onClick={() => onRemove(type.id)} aria-label={`Retirer le type ${type.name}`}>
                            <X size={14} />
                        </button>
                    </span>
                ) : null;
            })}

            {isAdding ? (
                <div
                    className="add-type-dropdown"
                    tabIndex={0}
                    onBlur={() => setIsAdding(false)}
                >
                    {available.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            className="add-type-option"
                            onMouseDown={e => {
                                // Empêche le blur de fermer le menu avant le clic.
                                e.preventDefault();
                                onAdd(type.id);
                                setIsAdding(false);
                            }}
                        >
                            {type.name} ({type.points} pts)
                        </button>
                    ))}
                    {available.length === 0 && <div className="no-types">Aucun type disponible</div>}
                </div>
            ) : (
                <button type="button" className="type-badge add-type-btn" onClick={() => setIsAdding(true)} aria-label="Ajouter un type">
                    +
                </button>
            )}
        </div>
    );
};

export default TypePicker;
