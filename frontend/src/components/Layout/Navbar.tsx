import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, User } from 'lucide-react';
import { useIdentity } from '../../hooks/useIdentity';
import { NAV_ENTRIES } from './navigation';
import './Navbar.css';

import iconSvg from '../../assets/icons/favicon.svg';

// La barre du bas ne montre pas le compte : il est dans l'en-tête.
const BAR_ENTRIES = NAV_ENTRIES.filter(entry => !entry.railOnly);

// Sur mobile, le bouton d'ajout se place au milieu de la barre, sous le
// pouce ; sur ordinateur, il vient après les destinations.
const MIDDLE = Math.ceil(BAR_ENTRIES.length / 2);

interface Props {
    // La modale de choix appartient au Layout : la barre ne fait que la
    // demander, comme n'importe quel autre bouton d'ajout du site.
    onAddClick: () => void;
}

const Navbar: React.FC<Props> = ({ onAddClick }) => {
    const { username } = useIdentity();

    const before = BAR_ENTRIES.slice(0, MIDDLE);
    const after = BAR_ENTRIES.slice(MIDDLE);

    const addButton = (className: string) => (
        <button
            type="button"
            className={`nav-add-btn ${className}`}
            onClick={onAddClick}
            aria-haspopup="dialog"
            aria-label="Ajouter"
        >
            <Plus size={24} />
        </button>
    );

    return (
        <>
            {/* En-tête mobile : le logo, et le compte à droite — il n'a pas
                besoin d'un des cinq emplacements de la barre du bas. */}
            <div className="mobile-header">
                <div className="mobile-header-logo">
                    <img src={iconSvg} alt="Logo" className="logo-img" />
                    <span className="logo-text">AURA Catcher</span>
                </div>
                <NavLink to="/compte" className={({ isActive }) => `header-account ${isActive ? 'active' : ''}`}>
                    <User size={16} />
                    <span>{username ?? 'Compte'}</span>
                </NavLink>
            </div>

            <nav className="mobile-nav">
                {before.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icon size={24} />
                        <span>{label}</span>
                    </NavLink>
                ))}

                <div className="nav-add">
                    {addButton('nav-add-btn--bar')}
                </div>

                {after.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icon size={24} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Ordinateur : les mêmes entrées, dans le même ordre, à la verticale */}
            <nav className="desktop-rail">
                <div className="rail-logo">
                    <img src={iconSvg} alt="Logo" className="logo-img" />
                    <span className="logo-text">AURA Catcher</span>
                </div>

                {NAV_ENTRIES.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}>
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}

                <div className="nav-add nav-add--rail">
                    <button
                        type="button"
                        className="nav-add-btn nav-add-btn--rail"
                        onClick={onAddClick}
                        aria-haspopup="dialog"
                    >
                        <Plus size={20} />
                        <span>Ajouter</span>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
