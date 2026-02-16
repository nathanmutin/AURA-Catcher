import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, SquarePen, BarChart, BookOpen } from 'lucide-react';
import './Navbar.css';

import iconSvg from '../../assets/icon.svg';

const Navbar: React.FC = () => {
    return (
        <>
            {/* Mobile Header (Logo) */}
            <div className="mobile-header">
                <img src={iconSvg} alt="Logo" className="logo-img" />
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
                <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <BarChart size={24} />
                    <span>Stats</span>
                </NavLink>
                <NavLink to="/manifesto" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <BookOpen size={24} />
                    <span>Manifeste</span>
                </NavLink>
            </nav>

            {/* Desktop Top Bar */}
            <nav className="desktop-nav">
                <div className="logo">
                    {/* SVG icon in src/assets/icon.svg */}
                    <img src={iconSvg} alt="Logo" className="logo-img" />
                    <span className="logo-text">AURA Catcher</span>
                </div>
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Carte
                    </NavLink>
                    <NavLink to="/farmer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Générateur
                    </NavLink>
                    <NavLink to="/stats" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Stats
                    </NavLink>
                    <NavLink to="/manifeste" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Manifeste
                    </NavLink>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
