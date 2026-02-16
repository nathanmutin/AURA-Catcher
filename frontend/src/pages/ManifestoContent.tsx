import React from 'react';
import { Link } from 'react-router-dom';
/* @ts-ignore */
import supervilleImage from '../assets/superville.jpg';
import appart1Image from '../assets/radio.jpg';
import appart2Image from '../assets/chiottard.jpg';
import mapImage from '../assets/map.jpg';

import './ManifestoPage.css';

export const ManifestoContent: React.FC = () => {
    return (
        <div className="manifesto-content">
            <h1>AURA Catcher : au-delà du troll</h1>

            <p className="intro">
                Le 16 janvier 2015, la Région Auvergne-Rhône-Alpes est créée.
                Celle que l'on surnomme rapidement AURA voit fleurir sur son territoire d'innombrables
                petits panneaux bleus dès le premier mandat de Laurent Wauquiez aka Le Seigneur des Panneaux.
            </p>

            <h2>Bienvenue en « République Populaire d'AURA »</h2>
            <p>
                Si vous avez l'impression que chaque abri-bus, chaque lycée ou chaque sentier
                de randonnée vous hurle « <strong>LA RÉGION</strong> » en blanc sur fond bleu,
                rassurez-vous : vous n'êtes pas seul. Sur les réseaux sociaux, cette omniprésence a
                même fini par créer une trend : la « République Populaire d'Auvergne-Rhône-Alpes »
                (ou « Wauquistan » pour les intimes).
                <a href="#source-rpaura" className="source-link" aria-label="Voir la source 2">
                    2
                </a>
                Parfois le sevrage peut être difficile à vivre lorsque l'on doit s'éloigner de notre belle région.
                Mais heureusement, des solutions existent pour garder un lien, le <Link to="/farmer">générateur de panneaux AURA Farmer</Link> est
                là pour vous permettre d'être soutenu par la Région à chaque instant.
            </p>
            <div className="images-row">
                <div className="image-container">
                    <img src={appart1Image} alt="Radio et micro-onde soutenus par la Région" />
                    <span className="caption">Radio et micro-onde soutenus par la Région</span>
                </div>
                <div className="image-container">
                    <img src={appart2Image} alt="Chiotard soutenu par la Région" />
                    <span className="caption">Toilettes soutenues par la Région</span>
                </div>
            </div>

            <p>
                Pour les autres qui ont la chance de parcourir nos communes, <Link to="/">la carte AURA Catcher</Link> vous permet
                de référencer un maximum de panneaux et de participer à un projet collectif.
            </p>
            <div className="image-container">
                <img src={mapImage} alt="Les panneaux AURA de la Presqu'ile à Lyon" />
                <span className="caption">Les panneaux AURA de la Presqu'ile à Lyon</span>
            </div>

            <h2>Pourquoi ça nous interesse ?</h2>
            <p>
                <a href="#source-crc1" className="source-link" aria-label="Voir la source 3">
                    3
                </a>
            </p>
            <div className="image-container">
                <img src={supervilleImage} alt="Accumulation de panneaux à l'entrée d'une ville" />
                <span className="caption">Une entrée de ville typique de la Région (suggestion de présentation)</span>
            </div>
            <blockquote>
                "Une super citation"
                <br /><br />
                — Chambre Régionale des Comptes Auvergne-Rhône-Alpes, Rapport sur la communication externe (Octobre 2024)
            </blockquote>
            <p>
                blabla
            </p>

            <h2>Notre Démarche</h2>
            <p>
                Lorem ipsum
            </p>

            <div className="sources">
                <h3>Sources</h3>
                <ol>
                    <li id="source-frinfo">
                        <a href="https://www.franceinfo.fr/elections/elections-regionales-en-auvergne-rhone-alpes-laurent-wauquiez-le-roi-de-la-com-qui-veut-garder-sa-couronne_4663023.html" target="_blank" rel="noopener noreferrer">
                            <strong>France Info</strong>, "Elections régionales en Auvergne-Rhône-Alpes : Laurent Wauquiez, le roi de la com qui veut garder sa couronne", 16 juin 2021
                        </a>
                    </li>
                    <li id="source-rpaura">
                        <a href="https://www.leprogres.fr/insolite/2025/07/22/quand-la-region-devient-la-republique-populaire-d-auvergne-rhone-alpes-sur-les-reseaux-sociaux" target="_blank" rel="noopener noreferrer">
                            <strong>Le Progrès</strong>, "Quand la Région devient la « République populaire d'Auvergne-Rhône-Alpes » sur les réseaux sociaux", 22 juillet 2025
                        </a>
                    </li>
                    <li id="source-crc1">
                        <a href="https://www.ccomptes.fr/fr/publications/region-auvergne-rhone-alpes-la-communication-externe" target="_blank" rel="noopener noreferrer">
                            <strong>Chambre Régionale des Comptes</strong>, "Rapport - Région Auvergne-Rhône-Alpes. La communication externe", 10 octobre 2024
                        </a>
                    </li>
                    <li id="source-crc2">
                        <a href="https://www.ccomptes.fr/fr/publications/la-communication-des-collectivites-territoriales-en-auvergne-rhone-alpes" target="_blank" rel="noopener noreferrer">
                            <strong>Chambre Régionale des Comptes</strong>, "Rapport - La communication des collectivités territoriales en Auvergne-Rhône-Alpes", 28 janvier 2025
                        </a>
                    </li>
                </ol>
            </div>
        </div>
    );
};
