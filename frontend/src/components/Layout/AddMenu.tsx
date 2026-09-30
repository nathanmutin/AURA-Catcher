import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADD_ENTRIES } from './navigation';
import './AddMenu.css';

interface Props {
    // Feuille qui monte du bas sur mobile, bulle à côté du bouton sur
    // ordinateur : même contenu, deux habillages.
    variant: 'sheet' | 'popover';
    onClose: () => void;
}

const AddMenu: React.FC<Props> = ({ variant, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        // Un clic sur le bouton + lui-même est ignoré : c'est lui qui gère
        // l'ouverture et la fermeture, sinon il rouvrirait aussitôt le menu.
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Element | null;
            if (target?.closest('.add-menu') || target?.closest('.nav-add-btn')) return;
            onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('pointerdown', onPointerDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('pointerdown', onPointerDown);
        };
    }, [onClose]);

    return (
        <>
            {variant === 'sheet' && <div className="add-menu-backdrop" />}

            <div className={`add-menu add-menu--${variant}`}>
                {variant === 'sheet' && <div className="add-menu-grab" />}

                {ADD_ENTRIES.map(({ to, label, icon: Icon }) => (
                    <button
                        key={to}
                        type="button"
                        className="add-menu-item"
                        onClick={() => { onClose(); navigate(to); }}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default AddMenu;
