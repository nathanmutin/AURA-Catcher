import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LeaderboardEntry, PanelType } from '@shared/types';
import { useDefaultAuthor } from '../PanelForm/AuthorField';
import ScoreHelp from './ScoreHelp';

// Rangs toujours visibles. On coupe sur le rang et non sur le nombre de
// lignes : un contributeur 10e ex æquo n'est pas masqué parce qu'il tombe
// sur la 11e ligne.
const TOP_RANK = 10;

type Row =
    | { kind: 'entry'; entry: LeaderboardEntry }
    | { kind: 'gap'; key: string };

// Même tolérance que la base (collation insensible à la casse) : le pseudo
// retenu sur l'appareil peut avoir été tapé « Natmut » pour le compte « natmut ».
const sameUsername = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Lignes du classement replié : le top, puis — si le visiteur n'y figure
 * pas — sa ligne entre ses deux voisins. Une ligne « … » marque chaque
 * saut dans le classement.
 */
function collapsedRows(entries: LeaderboardEntry[], meIndex: number): Row[] {
    const shown = new Set<number>();
    entries.forEach((entry, index) => {
        if (entry.rank <= TOP_RANK) shown.add(index);
    });

    if (meIndex >= 0 && entries[meIndex].rank > TOP_RANK) {
        for (let index = meIndex - 1; index <= meIndex + 1; index++) {
            if (index < entries.length) shown.add(index);
        }
    }

    const rows: Row[] = [];
    let previous = -1;
    [...shown].sort((a, b) => a - b).forEach((index) => {
        if (index > previous + 1) rows.push({ kind: 'gap', key: `gap-${index}` });
        rows.push({ kind: 'entry', entry: entries[index] });
        previous = index;
    });
    return rows;
}

interface Props {
    entries: LeaderboardEntry[];
    types: PanelType[];
}

const Leaderboard: React.FC<Props> = ({ entries, types }) => {
    const [expanded, setExpanded] = useState(false);

    // Pseudo vérifié de l'appareil, sinon le dernier pseudo utilisé pour
    // publier. Un pseudo non vérifié peut être celui de quelqu'un d'autre :
    // sans conséquence, on ne fait que surligner une ligne.
    const me = useDefaultAuthor();
    const meIndex = me ? entries.findIndex((entry) => sameUsername(entry.username, me)) : -1;
    const meEntry = meIndex >= 0 ? entries[meIndex] : undefined;

    const rows: Row[] = expanded
        ? entries.map((entry) => ({ kind: 'entry', entry }))
        : collapsedRows(entries, meIndex);
    const hasHiddenEntries = rows.filter((row) => row.kind === 'entry').length < entries.length;

    return (
        <div className="stats-section">
            <h2 className="section-title">Classement des contributeurs</h2>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Position</th>
                            <th>Contributeur</th>
                            <th>Nb. Panneaux</th>
                            <th>Score <ScoreHelp types={types} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            if (row.kind === 'gap') {
                                return (
                                    <tr key={row.key} className="leaderboard-gap">
                                        <td colSpan={4}>…</td>
                                    </tr>
                                );
                            }
                            const { entry } = row;
                            const isMe = entry === meEntry;
                            return (
                                <tr key={entry.username} className={isMe ? 'leaderboard-me' : undefined}>
                                    <td>
                                        <span className={`rank-badge rank-${entry.rank}`}>
                                            {entry.rank}
                                        </span>
                                    </td>
                                    <td>
                                        {entry.username}
                                        {isMe && <span className="leaderboard-me-tag">Vous</span>}
                                    </td>
                                    <td>{entry.totalPanels}</td>
                                    <td>{entry.count}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {(expanded || hasHiddenEntries) && (
                <div className="stats-more">
                    <button
                        type="button"
                        className="stats-more-button"
                        onClick={() => setExpanded((value) => !value)}
                        aria-expanded={expanded}
                    >
                        {expanded ? (
                            <>Réduire le classement <ChevronUp size={16} /></>
                        ) : (
                            <>Voir les {entries.length} contributeurs <ChevronDown size={16} /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
