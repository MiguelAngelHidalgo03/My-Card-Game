import { useEffect, useState } from "react";
import "./Ranking.css";
import { supabase } from "../../utils/supabaseClient";

export default function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRanking() {
            setLoading(true);
            const { data, error } = await supabase
                .from("record")
                .select(`
                    player_id,
                    wins,
                    losses,
                    total_games,
                    players (
                        user_id,
                        users (
                            username,
                            profile_picture
                        )
                    )
                `);
            if (error) {
                setRanking([]);
                setLoading(false);
                return;
            }

            // Agrupa por user_id
            const grouped = {};
            for (const r of data) {
                const userId = r.players?.user_id;
                if (!userId) continue;
                if (!grouped[userId]) {
                    grouped[userId] = {
                        user_id: userId,
                        username: r.players?.users?.username || "Desconocido",
                        profile_picture: r.players?.users?.profile_picture || "/assets/img/avatar_default.png",
                        wins: 0,
                        losses: 0,
                        total_games: 0,
                    };
                }
                grouped[userId].wins += r.wins;
                grouped[userId].losses += r.losses;
                grouped[userId].total_games += r.total_games;
            }
            const processed = Object.values(grouped)
                .filter(r => r.total_games >= 1)
                .map(r => ({
                    ...r,
                    win_ratio: r.total_games > 0 ? (r.wins / r.total_games) : 0,
                }))
                .sort((a, b) => b.win_ratio - a.win_ratio || b.wins - a.wins)
                .slice(0, 10);

            setRanking(processed);
            setLoading(false);
        }
        fetchRanking();
    }, []);

    return (
        <div className="ranking-page">
            <h1>🏆 TOP 10</h1>
            <p className="ranking-desc">
                Mejores jugadores en 1pa1
            </p>
            <p className="ranking-desc">
                Para entrar en la clasificación debes jugar con la sesión iniciada.
            </p>
            {loading ? (
                <div className="ranking-loading">Cargando...</div>
            ) : (
                <table className="ranking-table">
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Usuario</th>
                            <th>Victorias</th>
                            <th>Partidas</th>
                            <th>Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((player, idx) => (
                            <tr key={player.user_id}>
                                <td>{idx + 1}</td>
                                <td>
                                    <span className="ranking-user-cell">
                                        <img
                                            src={player.profile_picture}
                                            alt={player.username}
                                            className="ranking-avatar"
                                            onError={e => { e.target.onerror = null; e.target.src = "/assets/img/avatar_default.png"; }}
                                        />
                                        <span>{player.username}</span>
                                    </span>
                                </td>
                                <td>{player.wins}</td>
                                <td>{player.total_games}</td>
                                <td>{(player.win_ratio * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}