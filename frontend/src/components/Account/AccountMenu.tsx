import React, { useRef, useState } from 'react';
import { User, X } from 'lucide-react';
import { useIdentity, describeIdentityError } from '../../hooks/useIdentity';
import { STORAGE_KEYS } from '../../utils/constants';
import './AccountMenu.css';

type PanelView = 'closed' | 'menu' | 'claim' | 'code' | 'rename';

interface ClaimTarget {
    username: string;
    email: string;
}

// Menu de compte à l'échelle de l'app : protéger un pseudo (code reçu par
// email), le renommer, s'en déconnecter, ou en vérifier un autre pour changer
// de compte. Affiché dans la Navbar, donc accessible depuis n'importe où —
// contrairement à l'ancienne version qui vivait seulement dans la modale
// d'ajout de panneau.
const AccountMenu: React.FC = () => {
    const {
        username, pendingVerification, isLoading,
        claim, isClaiming, verifyCode, isVerifyingCode,
        logout, isLoggingOut, rename, isRenaming,
    } = useIdentity();
    const [view, setView] = useState<PanelView>('closed');
    const [pseudo, setPseudo] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    // Pseudo et adresse du code attendu : sert à l'afficher et à le renvoyer.
    const [target, setTarget] = useState<ClaimTarget | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [notice, setNotice] = useState('');
    const codeInputRef = useRef<HTMLInputElement>(null);

    const close = () => {
        setErrorMsg('');
        setView('closed');
    };

    const openMenu = () => {
        setErrorMsg('');
        setView('menu');
    };

    const openClaim = (prefill?: ClaimTarget) => {
        setErrorMsg('');
        setView('claim');

        if (prefill) {
            setPseudo(prefill.username);
            setEmail(prefill.email);
            return;
        }

        // Préremplit avec le dernier pseudo utilisé (localStorage) seulement
        // à la création initiale d'un compte, pas quand on clique "Protéger
        // un autre pseudo" pour changer de compte — dans ce second cas, la
        // valeur en cache serait très probablement le pseudo déjà vérifié.
        // Pas de vérification de disponibilité ici : revérifier un pseudo
        // qu'on possède déjà (ex: sur un nouvel appareil) est un cas d'usage
        // légitime, pas une usurpation — le backend l'autorise déjà tant que
        // l'email fourni correspond à celui déjà enregistré.
        setEmail('');
        setPseudo(username ? '' : localStorage.getItem(STORAGE_KEYS.LAST_AUTHOR) ?? '');
    };

    const openCode = (codeTarget: ClaimTarget) => {
        setErrorMsg('');
        setNotice('');
        setCode('');
        setTarget(codeTarget);
        setView('code');
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
        // Un code attend d'être saisi (la page a pu être rechargée pendant
        // qu'on allait le chercher dans ses mails) : on reprend là.
        if (pendingVerification) openCode(pendingVerification);
        else if (username) openMenu();
        else openClaim();
    };

    const handleClaimSubmit = async () => {
        if (!pseudo || !email) return;
        setErrorMsg('');
        try {
            await claim({ username: pseudo, email });
            openCode({ username: pseudo, email });
        } catch (err) {
            setErrorMsg(describeIdentityError(err));
        }
    };

    const handleCodeSubmit = async () => {
        if (code.length !== 6) return;
        setErrorMsg('');
        setNotice('');
        try {
            await verifyCode(code);
            openMenu();
        } catch (err) {
            // Champ vidé et curseur remis dedans : on peut retaper aussitôt.
            setCode('');
            setErrorMsg(describeIdentityError(err));
            codeInputRef.current?.focus();
        }
    };

    const handleResend = async () => {
        if (!target) return;
        setErrorMsg('');
        setNotice('');
        try {
            await claim(target);
            setCode('');
            setNotice('Nouveau code envoyé. Le précédent n\'est plus valable.');
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
                            <button className="account-action" onClick={() => openClaim()}>Protéger un autre pseudo</button>
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
                            {username && <p className="account-form-hint">Vérifier un autre pseudo vous déconnectera de « {username} » sur cet appareil une fois le code validé.</p>}
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
                                {isClaiming ? 'Envoi...' : 'Recevoir un code'}
                            </button>
                        </div>
                    )}

                    {view === 'code' && target && (
                        <form
                            className="account-form"
                            onSubmit={e => {
                                e.preventDefault();
                                handleCodeSubmit();
                            }}
                        >
                            <p className="account-form-hint">
                                Code envoyé à <strong>{target.email}</strong> pour protéger « {target.username} ». Il est valable 15 minutes.
                            </p>
                            <label htmlFor="account-code">Code à 6 chiffres</label>
                            {/* one-time-code : les téléphones proposent le code reçu au-dessus du clavier. */}
                            <input
                                ref={codeInputRef}
                                id="account-code"
                                className="account-code-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                autoFocus
                            />
                            {errorMsg && <p className="account-error">{errorMsg}</p>}
                            {notice && <p className="account-sent">{notice}</p>}
                            <button
                                type="submit"
                                className="account-submit-btn"
                                disabled={isVerifyingCode || code.length !== 6}
                            >
                                {isVerifyingCode ? 'Vérification...' : 'Valider'}
                            </button>
                            <div className="account-code-links">
                                <button type="button" className="account-link-btn" onClick={handleResend} disabled={isClaiming}>
                                    {isClaiming ? 'Envoi...' : 'Renvoyer le code'}
                                </button>
                                <button type="button" className="account-link-btn" onClick={() => openClaim(target)}>
                                    Changer d'email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountMenu;
