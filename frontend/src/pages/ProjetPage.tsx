import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Demarche from '../components/Projet/Demarche';
import './ProjetPage.css';

/**
 * Pourquoi ce site existe : la démarche, les citations du rapport de la
 * Chambre régionale des comptes, le contact et les sources. Les chiffres du
 * recensement vivent dans Stats.
 */
const ProjetPage: React.FC = () => {
    // Le contenu arrive après le chargement du module : à ce moment-là, le
    // navigateur a renoncé depuis longtemps à sauter à l'ancre demandée
    // (/projet#sources, ou une ancienne adresse /faq#source-crc1 redirigée).
    const { hash } = useLocation();
    useEffect(() => {
        if (!hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView();
    }, [hash]);

    return (
        <div className="page-container">
            <section id="demarche">
                <Demarche />
            </section>
        </div>
    );
};

export default ProjetPage;
