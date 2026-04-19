import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StatsPage.css';
import { fetchGlobalStats, fetchLeaderboard, fetchPanneaux, fetchTypes } from '../api/client';
import type { Panneau, PanelType } from '../../../backend/src/types';

interface GlobalStats {
    totalPanels: number;
    totalContributors: number;
}

interface LeaderboardEntry {
    username: string;
    count: number;
    totalPanels: number;
}

const StatsPage: React.FC = () => {
    const navigate = useNavigate();
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [panneaux, setPanneaux] = useState<Panneau[]>([]);
    const [types, setTypes] = useState<PanelType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [stats, leaders, panels, panelsTypes] = await Promise.all([
                    fetchGlobalStats(),
                    fetchLeaderboard(),
                    fetchPanneaux(),
                    fetchTypes()
                ]);
                setGlobalStats(stats);
                setLeaderboard(leaders);
                setPanneaux(panels);
                setTypes(panelsTypes);
            } catch (error) {
                console.error('Erreur de chargement des données:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return <div className="stats-container">Chargement...</div>;
    }

    return (
        <div className="stats-container">
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
                <div className="section-title">Top Contributeurs</div>
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
                <div className="section-title">Derniers panneaux</div>
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
                            {panneaux.map((p) => {
                                const date = new Date(p.createdAt).toLocaleDateString();
                                const typeName = types.find(t => t.id === p.typeId)?.name || 'Inconnu';
                                return (
                                    <tr 
                                        key={p.id} 
                                        className="clickable-row data-row"
                                        onClick={() => navigate(`/?panneauId=${p.id}`)}
                                        title="Cliquez pour voir sur la carte"
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
            </div>
        </div>
    );
};

export default StatsPage;
