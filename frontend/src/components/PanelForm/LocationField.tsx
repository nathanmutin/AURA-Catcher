import React from 'react';
import { MapPin } from 'lucide-react';
import './LocationField.css';

interface Props {
    // Texte affiché : coordonnées, "Position manquante"... propre à chaque formulaire.
    text: string;
    // Position renseignée / modifiée : colore l'épingle.
    highlighted: boolean;
    // Boutons d'action, différents selon le formulaire (choisir, déplacer, annuler...).
    children: React.ReactNode;
}

// Bandeau de position des formulaires de panneau. Seule la mise en forme est
// partagée : le libellé et les actions restent décidés par l'appelant, parce
// qu'ajouter un panneau ("Position manquante" / "Choisir sur la carte") et le
// recaler ("46.03276, 7.23640" / "Déplacer" / annuler) ne proposent pas la
// même chose.
const LocationField: React.FC<Props> = ({ text, highlighted, children }) => (
    <div className="location-section">
        <div className="location-status">
            <MapPin size={20} className={highlighted ? 'text-green' : 'text-gray'} />
            <span>{text}</span>
        </div>
        <div className="location-actions">{children}</div>
    </div>
);

export default LocationField;
