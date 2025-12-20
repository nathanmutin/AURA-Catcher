import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, SquarePen } from 'lucide-react';
import './Navbar.css'; // We'll create this

const Navbar: React.FC = () => {
    return (
        <>
            {/* Mobile Header (Logo) */}
            <div className="mobile-header">
                <img src="/src/assets/icon.svg" alt="Logo" className="logo-img" />
                <span className="logo-text">AURA Catcher</span>
            </div>

            {/* Mobile Bottom Bar */}
            <nav className="mobile-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Map size={24} />
                    <span>Carte</span>
                </NavLink>
                <NavLink to="/farmer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <SquarePen size={24} />
                    <span>Générateur</span>
                </NavLink>
            </nav>

            {/* Desktop Top Bar */}
            <nav className="desktop-nav">
                <div className="logo">
                    {/* SVG icon in src/assets/icon.svg */}
                    <img src="/src/assets/icon.svg" alt="Logo" className="logo-img" />
                    <span className="logo-text">AURA Catcher</span>
                </div>
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Carte
                    </NavLink>
                    <NavLink to="/farmer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Générateur
                    </NavLink>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
