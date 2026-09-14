import React from 'react';
import { useQuery } from '@tanstack/react-query';
import './StatsPage.css';
import { fetchGlobalStats, fetchLeaderboard, fetchPanneaux, fetchTypes } from '../api/client';
import Leaderboard from '../components/Stats/Leaderboard';
import RecentPanels from '../components/Stats/RecentPanels';

const StatsPage: React.FC = () => {
    const { data: globalStats, isLoading: isLoadingStats } = useQuery({ queryKey: ['stats'], queryFn: fetchGlobalStats });
    const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });
    const { data: panneaux = [], isLoading: isLoadingPanneaux } = useQuery({ queryKey: ['panneaux'], queryFn: fetchPanneaux });
    const { data: types = [], isLoading: isLoadingTypes } = useQuery({ queryKey: ['types'], queryFn: fetchTypes });

    const loading = isLoadingStats || isLoadingLeaderboard || isLoadingPanneaux || isLoadingTypes;

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

            <Leaderboard entries={leaderboard} types={types} />

            <RecentPanels panneaux={panneaux} types={types} />
        </div>
    );
};

export default StatsPage;
