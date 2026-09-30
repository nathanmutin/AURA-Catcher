import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchGlobalStats, fetchLeaderboard, fetchPanneaux, fetchTypes } from '../api/client';
import Leaderboard from '../components/Stats/Leaderboard';
import RecentPanels from '../components/Stats/RecentPanels';
import './StatsPage.css';

// Panneaux financés par la Région d'après le rapport de la Chambre régionale
// des comptes, détaillé sur la page À propos : 3 340 entrées de communes,
// 591 entrées de lycées, 1 115 salles techniques.
const PANNEAUX_FINANCES = 3340 + 591 + 1115;

/**
 * Où en est le recensement, et qui l'a fait avancer : les compteurs mis en
 * regard du nombre de panneaux financés, le classement, et les derniers
 * panneaux ajoutés.
 */
const StatsPage: React.FC = () => {
    const { data: globalStats, isLoading: isLoadingStats } = useQuery({ queryKey: ['stats'], queryFn: fetchGlobalStats });
    const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard });
    const { data: panneaux = [], isLoading: isLoadingPanneaux } = useQuery({ queryKey: ['panneaux'], queryFn: fetchPanneaux });
    const { data: types = [], isLoading: isLoadingTypes } = useQuery({ queryKey: ['types'], queryFn: fetchTypes });

    const loading = isLoadingStats || isLoadingLeaderboard || isLoadingPanneaux || isLoadingTypes;

    if (loading) {
        return <div className="page-container">Chargement...</div>;
    }

    const totalPanels = globalStats?.totalPanels ?? 0;
    const progress = Math.min(100, (totalPanels / PANNEAUX_FINANCES) * 100);

    return (
        <div className="page-container">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{totalPanels}</div>
                    <div className="stat-label">Panneaux référencés</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{globalStats?.totalContributors || 0}</div>
                    <div className="stat-label">Contributeurs</div>
                </div>
            </div>

            <div className="stats-progress">
                <div className="stats-progress-bar">
                    {/* Volontairement visible même à 0,5 % : c'est l'écart qui est le propos. */}
                    <span style={{ width: `${Math.max(progress, 0.5)}%` }} />
                </div>
                <p className="stats-progress-label">
                    {totalPanels} panneaux recensés sur les <strong>{PANNEAUX_FINANCES.toLocaleString('fr-FR')}</strong> financés
                    par la Région pour les entrées de communes, les entrées de lycées et leurs salles techniques.{' '}
                    <Link to="/projet#demarche">D'où vient ce chiffre ?</Link>
                </p>
            </div>

            <Leaderboard entries={leaderboard} types={types} />

            <RecentPanels panneaux={panneaux} types={types} />
        </div>
    );
};

export default StatsPage;
