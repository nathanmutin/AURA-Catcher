import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import './StatsPage.css';
import { fetchGlobalStats, fetchLeaderboard, fetchPanneaux, fetchTypes } from '../api/client';


const ITEMS_PER_PAGE = 10;

const StatsPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const { data: globalStats, isLoading: isLoadingStats } = useQuery({ queryKey: ['stats'], queryFn: fetchGlobalStats });
    const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });
    const { data: panneaux = [], isLoading: isLoadingPanneaux } = useQuery({ queryKey: ['panneaux'], queryFn: fetchPanneaux });
    const { data: types = [], isLoading: isLoadingTypes } = useQuery({ queryKey: ['types'], queryFn: fetchTypes });

    const loading = isLoadingStats || isLoadingLeaderboard || isLoadingPanneaux || isLoadingTypes;

    if (loading) {
        return <div className="stats-container">Chargement...</div>;
    }

    const totalPages = Math.max(1, Math.ceil(panneaux.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPanneaux = panneaux.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="stats-container">
            {/* Visually hidden h1 for SEO and screen readers. Ensures a proper document outline. */}
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>Statistiques AURA Catcher</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{globalStats?.totalPanels || 0}</div>
                    <div className="stat-label">Panneaux référencés</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{globalStats?.totalContributors || 0}</div>
                    <div className="stat-label">Contributeurs</div>
                </div>
            </div>

            <div className="stats-section">
                <h2 className="section-title">Top 10 des Contributeurs</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Position</th>
                                <th>Contributeur</th>
                                <th>Score</th>
                                <th>Nb. Panneaux</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, index) => (
                                <tr key={entry.username}>
                                    <td>
                                        <span className={`rank-badge rank-${index + 1}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td>{entry.username}</td>
                                    <td>{entry.count}</td>
                                    <td>{entry.totalPanels}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="stats-section">
                <h2 className="section-title">Derniers panneaux</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Date</th>
                                <th>Auteur</th>
                                <th>Type</th>
                                <th>Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPanneaux.map((p) => {
                                const date = new Date(p.createdAt).toLocaleDateString();
                                const typeName = types.find(t => t.id === p.typeId)?.name || 'Inconnu';
                                return (
                                    <tr
                                        key={p.id}
                                        className="clickable-row data-row"
                                        onClick={() => navigate(`/?panneauId=${p.id}`)}
                                        title={`Panneau n°${p.id} - Cliquez pour voir sur la carte`}
                                    >
                                        <td>
                                            {p.imageUrl && (
                                                <img src={`${import.meta.env.VITE_API_URL || ''}${p.imageUrl}`} alt="Panel" className="panel-thumb" />
                                            )}
                                        </td>
                                        <td>{date}</td>
                                        <td>{p.author || 'Anonyme'}</td>
                                        <td>{typeName}</td>
                                        <td>{p.comment || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <button
                            className="btn-pagination"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            Précédent
                        </button>
                        <span className="pagination-info">Page {currentPage} sur {totalPages}</span>
                        <button
                            className="btn-pagination"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsPage;
