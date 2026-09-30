import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Mail } from 'lucide-react';
import { SiWhatsapp } from '@icons-pack/react-simple-icons';
import AccountPanel from '../components/Account/AccountPanel';
import './AccountPage.css';

/**
 * La page Compte, identique sur mobile et sur ordinateur : l'identité de
 * l'appareil, et les quelques liens qui n'ont plus de place dans la
 * navigation.
 */
const AccountPage: React.FC = () => (
    <div className="account-page">
        <div className="account-card">
            <h1>Compte</h1>
            <AccountPanel />
        </div>

        <div className="account-card">
            <h2>Rejoindre les autres</h2>
            <a
                className="account-external"
                href="https://chat.whatsapp.com/KwSXNjGhSJ5BkzgSqcHnSP"
                target="_blank"
                rel="noopener noreferrer"
            >
                <SiWhatsapp size={20} /> Groupe WhatsApp
            </a>
            <a className="account-external" href="mailto:contact@aura.nitum.fr">
                <Mail size={20} /> contact@aura.nitum.fr
            </a>
            <Link className="account-external" to="/projet#demarche">
                <HelpCircle size={20} /> À propos et démarche
            </Link>
        </div>
    </div>
);

export default AccountPage;
