import React from 'react';
import { useIdentity } from '../../hooks/useIdentity';
import { STORAGE_KEYS } from '../../utils/constants';
import './AuthorField.css';

interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

/**
 * Pseudo sous lequel on publie ou on modifie.
 *
 * Le champ reste librement modifiable même quand un pseudo est protégé sur
 * l'appareil : on peut publier sous un autre pseudo libre sans se
 * déconnecter (voir authService.resolveAuthor côté serveur, qui n'autorise
 * que ça — pas l'usurpation d'un pseudo déjà protégé par quelqu'un d'autre).
 * Le décalage est simplement signalé.
 */
const AuthorField: React.FC<Props> = ({ label, value, onChange }) => {
    const { username: verifiedUsername } = useIdentity();

    return (
        <div className="form-group">
            <label>{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Votre pseudo"
            />
            {verifiedUsername && value !== verifiedUsername && (
                <p className="author-hint">Publié sous un autre pseudo que celui protégé sur cet appareil ({verifiedUsername}).</p>
            )}
        </div>
    );
};

// Valeur de départ du champ : le pseudo vérifié de l'appareil s'il y en a un,
// sinon le dernier pseudo utilisé. Chaque formulaire décide *quand*
// l'appliquer (à l'ouverture, au changement de panneau...).
export function useDefaultAuthor(): string {
    const { username: verifiedUsername } = useIdentity();
    return verifiedUsername ?? localStorage.getItem(STORAGE_KEYS.LAST_AUTHOR) ?? '';
}

// À appeler après un envoi réussi, pour préremplir la prochaine fois.
export function rememberAuthor(author: string): void {
    if (author) {
        localStorage.setItem(STORAGE_KEYS.LAST_AUTHOR, author);
    }
}

export default AuthorField;
