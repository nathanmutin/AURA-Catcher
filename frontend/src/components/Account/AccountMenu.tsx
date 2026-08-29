import React, { useState } from 'react';
import { User, X } from 'lucide-react';
import { useIdentity, describeIdentityError } from '../../hooks/useIdentity';
import './AccountMenu.css';

type PanelView = 'closed' | 'menu' | 'claim' | 'claimSent' | 'rename';

// Menu de compte à l'échelle de l'app : protéger un pseudo (vérification par
// email), le renommer, s'en déconnecter, ou en vérifier un autre pour changer
// de compte. Affiché dans la Navbar, donc accessible depuis n'importe où —
// contrairement à l'ancienne version qui vivait seulement dans la modale
// d'ajout de panneau.
const AccountMenu: React.FC = () => {
    const { username, isLoading, claim, isClaiming, logout, isLoggingOut, rename, isRenaming } = useIdentity();
    const [view, setView] = useState<PanelView>('closed');
    const [pseudo, setPseudo] = useState('');
    const [email, setEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const close = () => {
        setErrorMsg('');
        setView('closed');
    };

    const openMenu = () => {
        setErrorMsg('');
        setView('menu');
    };

    const openClaim = () => {
        setErrorMsg('');
        setPseudo('');
        setEmail('');
        setView('claim');
    };

    const openRename = () => {
        setErrorMsg('');
        setNewUsername(username ?? '');
        setView('rename');
    };

    const toggle = () => {
        if (view !== 'closed') {
            close();
            return;
        }
        if (username) openMenu(); else openClaim();
    };

    const handleClaimSubmit = async () => {
        if (!pseudo || !email) return;
        setErrorMsg('');
        try {
            await claim({ username: pseudo, email });
            setView('claimSent');
        } catch (err) {
            setErrorMsg(describeIdentityError(err));
        }
    };

    const handleRenameSubmit = async () => {
        if (!newUsername || newUsername === username) return;
        setErrorMsg('');
        try {
            await rename(newUsername);
            close();
        } catch (err) {
            setErrorMsg(describeIdentityError(err));
        }
    };

    const handleLogout = async () => {
        await logout();
        close();
    };

    if (isLoading) return null;

    return (
        <div className="account-menu">
            <button className="account-toggle-btn" onClick={toggle}>
                <User size={16} />
                <span>{username ?? 'Compte'}</span>
            </button>

            {view !== 'closed' && (
                <div className="account-dropdown">
                    <button className="account-close-btn" onClick={close} aria-label="Fermer">
                        <X size={14} />
                    </button>

                    {view === 'menu' && username && (
                        <>
                            <div className="account-current">✅ {username}</div>
                            <button className="account-action" onClick={openRename}>Renommer ce pseudo</button>
                            <button className="account-action" onClick={openClaim}>Protéger un autre pseudo</button>
                            <button className="account-action account-logout" onClick={handleLogout} disabled={isLoggingOut}>
                                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                            </button>
                        </>
                    )}

                    {view === 'rename' && (
                        <div className="account-form">
                            <label>Nouveau pseudo</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                placeholder="Nouveau pseudo"
                            />
                            {errorMsg && <p className="account-error">{errorMsg}</p>}
                            <button
                                type="button"
                                className="account-submit-btn"
                                onClick={handleRenameSubmit}
                                disabled={isRenaming || !newUsername || newUsername === username}
                            >
                                {isRenaming ? 'Renommage...' : 'Renommer'}
                            </button>
                        </div>
                    )}

                    {view === 'claim' && (
                        <div className="account-form">
                            {username && <p className="account-form-hint">Vérifier un autre pseudo vous déconnectera de « {username} » sur cet appareil une fois le lien confirmé.</p>}
                            <label>Pseudo à protéger</label>
                            <input
                                type="text"
                                value={pseudo}
                                onChange={e => setPseudo(e.target.value)}
                                placeholder="Votre pseudo"
                            />
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleClaimSubmit();
                                    }
                                }}
                                placeholder="Votre email"
                            />
                            {errorMsg && <p className="account-error">{errorMsg}</p>}
                            <button
                                type="button"
                                className="account-submit-btn"
                                onClick={handleClaimSubmit}
                                disabled={isClaiming || !pseudo || !email}
                            >
                                {isClaiming ? 'Envoi...' : 'Envoyer le lien'}
                            </button>
                        </div>
                    )}

                    {view === 'claimSent' && (
                        <p className="account-sent">📧 Vérifiez votre boîte mail (lien valable 15 min).</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountMenu;
