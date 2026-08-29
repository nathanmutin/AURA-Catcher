import React from 'react';
import { useQuery } from '@tanstack/react-query';
import './StatsPage.css';
import { fetchGlobalStats, fetchLeaderboard } from '../api/client';

const StatsPage: React.FC = () => {
    const { data: globalStats, isLoading: isLoadingStats } = useQuery({ queryKey: ['stats'], queryFn: fetchGlobalStats });
    const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });

    const loading = isLoadingStats || isLoadingLeaderboard;

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
        </div>
    );
};

export default StatsPage;
