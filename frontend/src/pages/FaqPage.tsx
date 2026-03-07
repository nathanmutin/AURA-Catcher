import React from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';
/* @ts-ignore */
import supervilleImage from '../assets/superville.webp';
import appart1Image from '../assets/radio.webp';
import appart2Image from '../assets/chiottard.webp';
import mapImage from '../assets/map.webp';

import './FaqPage.css';

const FaqPage: React.FC = () => {
    return (
        <div className="faq-page">
            <div className="faq-container">
                <div className="faq-content">
                    <h1>À propos d'AURA Catcher</h1>

                    <h2>Qu'est-ce que AURA Catcher ?</h2>
                    <p>
                        AURA Catcher est un site web qui permet de visualiser et de référencer un maximum
                        de panneaux de la Région Auvergne-Rhône-Alpes.
                        Il permet également de générer des panneaux personnalisés.
                    </p>
                    <div className="image-container">
                        <img src={mapImage} alt="Les panneaux AURA de la Presqu'île à Lyon" />
                        <span className="caption">Les panneaux AURA de la Presqu'île à Lyon</span>
                    </div>

                    <h2>Qui sommes-nous ?</h2>
                    <p>
                        Je suis un habitant de la Région Auvergne-Rhône-Alpes, particulièrement fan de la
                        trend République Populaire d'Auvergne-Rhône-Alpes.
                        <a href="#source-rpaura" className="source-link" aria-label="Voir la source 1">
                            1
                        </a> J'ai d'abord créé le générateur de panneaux AURA Farmer pour décorer ma coloc avec
                        un compatriote Auranien. Puis l'idée de référencer les panneaux bleus de la région m'a
                        apparue suffisamment débile pour que je m'y consacre.
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
                        Toute aide pour maintenir et améliorer ce site est la bienvenue ! Le code source est
                        disponible sur GitHub.
                    </p>
                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <a href="https://github.com/nathanmutin/AURA-Catcher" target="_blank" rel="noopener noreferrer" className="github-button">
                            <SiGithub size={24} style={{ marginRight: '10px' }} />
                            Voir sur GitHub
                        </a>
                    </div>

                    <h2>Notre Démarche</h2>
                    <p>
                        Si ce site n'a pas de grandes prétentions, il vise tout de même à mettre en valeur les
                        dérives de la communication politique. N'oublions pas que derrière chaque panneau, il y a
                        des fonds publics
                    </p>
                    <p>
                        L'executif de la Région Auvergne-Rhône-Alpes est sensiblement très motivé pour
                        communiquer sur ses actions.
                        <a href="#source-frinfo" className="source-link" aria-label="Voir la source 2">
                            2
                        </a> Il faut que les électeurs et électrices sachent où va leur argent et
                        surtout .. d'où il vient !
                        La Chambre Régionale des Comptes Auvergne-Rhône-Alpes s'est penchée sur le sujet
                        et TODO

                        <a href="#source-crc1" className="source-link" aria-label="Voir la source 3">
                            3
                        </a>
                    </p>
                    <p>
                        La Région AURA n'a rien d'exceptionnelle à cet égard, bien au contraire. À tous les échelons
                        les dépenses de communication semblent être un impératif. On voit se multiplier les
                        panneaux, magazines d'information, flyers et bâches. Les logos se retrouvent aux
                        entrées des communes, sur les arrêts de bus, devant les lycées, quand ce n'est pas
                        directement le portrait du Président ou de la Présidente de Région qui est imprimé
                        dans les manuels scolaires.
                        <a href="#source-pecresse1" className="source-link" aria-label="Voir la source 5">
                            5
                        </a>
                        <a href="#source-pecresse2" className="source-link" aria-label="Voir la source 6">
                            6
                        </a>
                    </p>
                    <div className="image-container">
                        <img src={supervilleImage} alt="Accumulation de panneaux à l'entrée d'une ville" />
                        <span className="caption">Une entrée de ville typique en France</span>
                    </div>
                    <p>
                        La Chambre Régionale des Comptes Auvergne-Rhône-Alpes s'est aussi intéressée aux dépenses
                        TODO
                    </p>
                    <blockquote>
                        "Une super citation"
                        <br /><br />
                        — Chambre Régionale des Comptes Auvergne-Rhône-Alpes, Rapport sur la communication externe (Octobre 2024)
                    </blockquote>

                    <div className="sources">
                        <h3>Sources</h3>
                        <ol>
                            <li id="source-rpaura">
                                <a href="https://www.leprogres.fr/insolite/2025/07/22/quand-la-region-devient-la-republique-populaire-d-auvergne-rhone-alpes-sur-les-reseaux-sociaux" target="_blank" rel="noopener noreferrer">
                                    <strong>Le Progrès</strong>, "Quand la Région devient la « République populaire d'Auvergne-Rhône-Alpes » sur les réseaux sociaux", 22 juillet 2025
                                </a>
                            </li>
                            <li id="source-frinfo">
                                <a href="https://www.franceinfo.fr/elections/elections-regionales-en-auvergne-rhone-alpes-laurent-wauquiez-le-roi-de-la-com-qui-veut-garder-sa-couronne_4663023.html" target="_blank" rel="noopener noreferrer">
                                    <strong>France Info</strong>, "Elections régionales en Auvergne-Rhône-Alpes : Laurent Wauquiez, le roi de la com qui veut garder sa couronne", 16 juin 2021
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
                            <li id="source-pecresse1">
                                <a href="https://www.leparisien.fr/val-d-oise-95/ile-de-france-la-lettre-de-valerie-pecresse-dans-les-manuels-scolaires-cree-la-polemique-30-09-2019-8163276.php" target="_blank" rel="noopener noreferrer">
                                    <strong>Le Parisien</strong>, "Ile-de-France : la lettre de Valérie Pécresse dans les manuels scolaires crée la polémique", 30 septembre 2019
                                </a>
                            </li>
                            <li id="source-pecresse2">
                                <a href="https://www.tf1.fr/fr-ch/tmc/quotidien-avec-yann-barthes/videos/comment-valerie-pecresse-sest-offert-une-belle-pub-gratuite-dans-les-livres-scolaires-25856165.html" target="_blank" rel="noopener noreferrer">
                                    <strong>Quotidien</strong>, "Comment Valérie Pécresse s'est offert une belle pub gratuite dans les livres scolaires", 29 septembre 2020
                                </a>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaqPage;
