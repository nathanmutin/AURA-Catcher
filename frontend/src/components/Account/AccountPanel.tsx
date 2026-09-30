import React, { useEffect, useRef, useState } from 'react';
import { useIdentity, describeIdentityError } from '../../hooks/useIdentity';
import { STORAGE_KEYS } from '../../utils/constants';
import './AccountPanel.css';

type PanelView = 'menu' | 'claim' | 'code' | 'rename';

interface ClaimTarget {
    username: string;
    email: string;
}

/**
 * Protéger un pseudo (code reçu par email), le renommer, s'en déconnecter,
 * ou en vérifier un autre pour changer de compte.
 *
 * Vit dans la page Compte, atteignable depuis la navigation sur les deux
 * tailles d'écran — il n'y a plus de menu déroulant à maintenir en parallèle.
 */
const AccountPanel: React.FC = () => {
    const {
        username, pendingVerification, isLoading,
        claim, isClaiming, verifyCode, isVerifyingCode,
        logout, isLoggingOut, rename, isRenaming,
    } = useIdentity();

    const [view, setView] = useState<PanelView | null>(null);
    const [pseudo, setPseudo] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    // Pseudo et adresse du code attendu : sert à l'afficher et à le renvoyer.
    const [target, setTarget] = useState<ClaimTarget | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [notice, setNotice] = useState('');
    const codeInputRef = useRef<HTMLInputElement>(null);

    // Vue de départ, une fois l'identité connue : un code en attente reprend
    // la main (la page a pu être rechargée pendant qu'on allait le chercher
    // dans ses mails), sinon on montre le compte ou l'invitation à en créer un.
    useEffect(() => {
        if (isLoading || view !== null) return;
        if (pendingVerification) {
            setTarget(pendingVerification);
            setView('code');
        } else {
            setView(username ? 'menu' : 'claim');
        }
    }, [isLoading, view, username, pendingVerification]);

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
            setView('menu');
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
            setView('menu');
        } catch (err) {
            setErrorMsg(describeIdentityError(err));
        }
    };

    const handleLogout = async () => {
        await logout();
        setErrorMsg('');
        openClaim();
    };

    if (isLoading || view === null) return <p className="account-loading">Chargement...</p>;

    return (
        <div className="account-panel">
            {view === 'menu' && username && (
                <>
                    <div className="account-current">✅ {username}</div>
                    <p className="account-form-hint">
                        Ce pseudo est protégé sur cet appareil : personne d'autre ne peut publier sous ce nom.
                    </p>
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
                    <button type="button" className="account-link-btn" onClick={() => setView('menu')}>Annuler</button>
                </div>
            )}

            {view === 'claim' && (
                <div className="account-form">
                    <p className="account-form-hint">
                        {username
                            ? `Vérifier un autre pseudo vous déconnectera de « ${username} » sur cet appareil une fois le code validé.`
                            : 'Protéger un pseudo empêche quelqu\'un d\'autre de publier sous votre nom. Vous recevrez un code par email.'}
                    </p>
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
                    {username && (
                        <button type="button" className="account-link-btn" onClick={() => setView('menu')}>Annuler</button>
                    )}
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
    );
};

export default AccountPanel;
