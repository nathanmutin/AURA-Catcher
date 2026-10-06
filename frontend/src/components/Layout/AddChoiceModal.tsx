import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormModal from '../PanelForm/FormModal';
import { ADD_CHOICES, GENERATOR_ENTRY } from './navigation';
import './AddChoiceModal.css';

interface Props {
    onClose: () => void;
}

/**
 * La seule porte d'ajout du site : tous les boutons « ajouter », celui de la
 * navigation comme celui d'une page, ouvrent cette modale.
 *
 * Son seul rôle est de faire trancher entre un panneau et un objet, au lieu
 * de laisser deux entrées séparées décider à la place de l'utilisateur. Le
 * choix est posé comme une question, pas comme deux catégories : un mot, une
 * icône, et trois mots de précision.
 */
const { icon: GeneratorIcon, label: generatorLabel, to: generatorTo } = GENERATOR_ENTRY;

const AddChoiceModal: React.FC<Props> = ({ onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const go = (to: string) => {
        onClose();
        navigate(to);
    };

    return (
        <FormModal title="Que veux-tu ajouter ?" onClose={onClose} className="add-choice-card" dismissOnBackdrop>
            <div className="add-choice-grid">
                {ADD_CHOICES.map(({ to, label, hint, icon: Icon }) => (
                    <button key={to} type="button" className="add-choice" onClick={() => go(to)}>
                        <Icon size={32} strokeWidth={1.75} />
                        <span className="add-choice-label">{label}</span>
                        <span className="add-choice-hint">{hint}</span>
                    </button>
                ))}
            </div>

            <button type="button" className="add-choice-aside" onClick={() => go(generatorTo)}>
                <GeneratorIcon size={16} />
                <span>{generatorLabel}</span>
            </button>
        </FormModal>
    );
};

export default AddChoiceModal;
