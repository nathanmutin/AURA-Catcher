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
                        trend République Populaire d'Auvergne-Rhône-Alpes
                        <a href="#source-rpaura" className="source-link" aria-label="Voir la source 1">
                            1
                        </a>. J'ai d'abord créé le générateur de panneaux AURA Farmer pour décorer ma coloc avec
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
                        dérives de la communication politique. Car <strong>n'oublions pas que derrière chaque
                            panneau, il y a de l'argent public</strong>.

                        <br />
                        <br />

                        L'executif de la Région Auvergne-Rhône-Alpes est sensiblement très motivé pour
                        communiquer sur ses actions
                        <a href="#source-frinfo" className="source-link" aria-label="Voir la source 2">
                            2
                        </a>. Il faut que les électeurs et électrices sachent où va leur argent et
                        surtout .. d'où il vient !
                        Lephènomène est assez important pour que la Chambre Régionale des Comptes
                        Auvergne-Rhône-Alpes se soit penchée sur le sujet en 2024
                        <a href="#source-crc1" className="source-link" aria-label="Voir la source 3">
                            3
                        </a>.

                        <br />
                        <br />

                        Elle en a conclu que depuis 2016, les dépenses de communication externes de la Région
                        ont augmentés jusqu'à atteindre environ 35 millions d'euros par an (Tableau n°21 du rapport)
                        Au total, 7 millions d'euros ont été dépensés pour fleurir la Région de ces panneaux
                        bleus qu'on aime tant
                        <a href="#note-1" className="note-link" aria-label="Aller à la note 1" title="Voir la note">
                            [1]
                        </a>. Ainsi, <strong>3340 communes</strong>, <strong>591 entrées de lycées</strong>
                        , <strong>1115 salles techniques</strong> dans les lycées, et d'innombrables autres lieux
                        peuvent être référencés sur ce site, ça nous laisse de quoi faire ! Presque 10 autres
                        millions ont servi à recouvrir cars, trains et minibus de logos bleus
                        <a href="#note-2" className="note-link" aria-label="Aller à la note 2" title="Voir la note">
                            [2]
                        </a>.

                        <br />
                        <br />

                        Il arrive même parfois que la dépense de communication soit plus importante que
                        le coût de la mesure dont il est fait la promotion
                        <a href="#note-3" className="note-link" aria-label="Aller à la note 3" title="Voir la note">
                            [3]
                        </a> !
                        Enfin, la chambre régionale des comptes déplore un mélange des genres entre communications
                        institutionnelle et politique. Elle révèle une stratégie de communication
                        "mise au service du Président" (p.10) via une incarnation personelle très forte.
                    </p>

                    <blockquote>
                        "Un axe important de la politique de communication de la région est de mettre en avant
                        la personne de son président"
                        <br /><br />
                        "La chambre estime que l'amalgame entre le président du conseil régional et la
                        collectivité régionale peut mener à engager des dépenses qui ne sont pas uniquement motivées
                        par des logiques de communication institutionnelle"
                        <br /><br />
                        — Chambre Régionale des Comptes Auvergne-Rhône-Alpes, Juillet 2024
                    </blockquote>

                    <div className="image-container">
                        <img src={supervilleImage} alt="Accumulation de panneaux à l'entrée d'une ville" />
                        <span className="caption">Une entrée de ville typique en France</span>
                    </div>

                    <p>
                        Pourtant, la Région AURA n'a rien d'exceptionnelle à cet égard, bien au contraire.
                        À tous les échelons on voit se multiplier panneaux, magazines d'information, flyers et bâches. Les
                        logos se retrouvent aux entrées des communes, sur les arrêts de bus, devant les lycées,
                        quand ce n'est pas directement le portrait du Président ou de la Présidente de Région
                        qui est imprimé en première page des manuels scolaires
                        <a href="#source-pecresse1" className="source-link" aria-label="Voir la source 4">
                            4
                        </a>
                        <a href="#source-pecresse2" className="source-link" aria-label="Voir la source 5">
                            5
                        </a>.

                        <br />
                        <br />

                        Pour être totalement honnête, la Région AURA est presque en retrait dans la course
                        aux dépenses de communication. Car la Chambre Régionale des Comptes Auvergne-Rhône-Alpes
                        s'est aussi intéressée aux dépenses de 12 autres collectivités territoriales dans un autre rapport
                        <a href="#source-crc2" className="source-link" aria-label="Voir la source 6">
                            6
                        </a>. Une fois rapportées aux nombre d'administrés, les dépenses de communication
                        externe sont de 4,5 € par habitant par an pour la Région quand elles s'élèvent à plus de 15 € par habitant par an pour plus la majorité des villes auditées.
                        En fait, le sujet dépasse largement la Région et la figure de Laurent Wauquiez. <strong>Utiliser de
                            l'argent public pour se vendre politiquement est malheureusement une pratique transpartisanne
                            qui dépasse les clivages</strong>.

                        <br />
                        <br />

                        Au total, la Chambre Régionale des Comptes estime <strong>entre 30 et 50 € par habitant par an</strong> les
                        dépenses de communication externe des différentes strates territoriales en Auvergne-Rhône-Alpes.
                        Personellement, je ne pense pas que ce chiffre ait vocation à être ramené à 0 €, une bonne communication
                        entre citoyens et administrations est nécessaire pour une démocratie fonctionnelle. Cependant, il est
                        nécessaire et sain de questioner ces dépenses et d'en interroger la pertinence.
                    </p>

                    <div className="footnotes">
                        <h3>Notes</h3>
                        <ol>
                            <li id="note-1">
                                Panneaux à l'entrée des communes et en contrepartie de subventions (bâches, etc.) (5,55 M€, p.41) et dans les lycées (1,44 M€, p.43). Soit un total de 6,99 M€.
                            </li>
                            <li id="note-2">
                                Pélliculage des cars (3,5 M€, p.44), des TER (4,6 M€, p.44) et des minibus (1,5 M€, p.45). Soit un total de 9,6 M€.
                            </li>
                            <li id="note-3">
                                Prise en charge d'un hélicoptère de secours pour le CHU de Clermont-Ferrand en 2020 (p.5)
                            </li>
                        </ol>
                    </div>

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
                                    <strong>Chambre Régionale des Comptes</strong>, "Rapport - Région Auvergne-Rhône-Alpes. La communication externe", juillet 2024
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
                            <li id="source-crc2">
                                <a href="https://www.ccomptes.fr/fr/publications/la-communication-des-collectivites-territoriales-en-auvergne-rhone-alpes" target="_blank" rel="noopener noreferrer">
                                    <strong>Chambre Régionale des Comptes</strong>, "Rapport - La communication des collectivités territoriales en Auvergne-Rhône-Alpes", novembre 2024
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
