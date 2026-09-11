import React from 'react';
import { X } from 'lucide-react';
import './FormModal.css';

interface Props {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    // Pour les variantes propres à un formulaire (espacements, largeur...).
    className?: string;
}

// Coquille commune aux formulaires en modale (ajout et modification d'un
// panneau) : voile, carte, bouton de fermeture, titre. Le contenu et la
// logique restent à la charge de chaque formulaire.
const FormModal: React.FC<Props> = ({ title, onClose, children, className }) => (
    <div className="modal-overlay">
        <div className={className ? `modal-card ${className}` : 'modal-card'}>
            <button className="close-btn" onClick={onClose} aria-label="Fermer"><X /></button>
            <h2>{title}</h2>
            {children}
        </div>
    </div>
);

export default FormModal;
