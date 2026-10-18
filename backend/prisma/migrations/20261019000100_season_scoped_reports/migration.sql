-- Reportes y búsquedas por temporada: cada función recibe p_season_id
-- (NULL = todas las temporadas). Cambiar los parámetros obliga a recrearlas.
-- El equipo todos estrellas y los entrenadores siguen siendo globales: las
-- estadísticas de los peloteros no van por temporada (decisión del equipo).

DROP FUNCTION public.get_standings();

CREATE FUNCTION public.get_standings(p_season_id integer DEFAULT NULL)
    RETURNS TABLE(team_id integer, team_name character varying, games_played bigint, points bigint)
    LANGUAGE sql
    AS $$
    SELECT
        t.team_id,
        t.name,
        COUNT(m.match_id),
        SUM(
            CASE
                WHEN m.home_team_id = t.team_id
                     AND m.home_score > m.away_score
                    THEN 1
                WHEN m.away_team_id = t.team_id
                     AND m.away_score > m.home_score
                    THEN 1
                ELSE 0
            END
        )
    FROM team t
    LEFT JOIN match m
        ON (m.home_team_id = t.team_id OR m.away_team_id = t.team_id)
        AND (
            p_season_id IS NULL
            OR m.phase_id IN (
                SELECT phase_id FROM phase WHERE season_id = p_season_id
            )
        )
    -- Con temporada: solo sus equipos inscritos.
    WHERE p_season_id IS NULL
       OR EXISTS (
           SELECT 1 FROM season_team st
           WHERE st.season_id = p_season_id AND st.team_id = t.team_id
       )
    GROUP BY t.team_id, t.name
    ORDER BY 4 DESC, t.name;
$$;

DROP FUNCTION public.get_team_status(integer);

CREATE FUNCTION public.get_team_status(search_team_id integer, p_season_id integer DEFAULT NULL)
    RETURNS TABLE(phase_name character varying, games_won_total bigint, games_lost_total bigint, games_won_away bigint, games_lost_away bigint, games_won_home bigint, games_lost_home bigint)
    LANGUAGE sql
    AS $$
    SELECT
        p.name,
        COUNT(*) FILTER (
            WHERE
                (m.away_team_id = search_team_id AND m.away_score > m.home_score)
                OR
                (m.home_team_id = search_team_id AND m.home_score > m.away_score)
        ),
        COUNT(*) FILTER (
            WHERE
                (m.away_team_id = search_team_id AND m.away_score < m.home_score)
                OR
                (m.home_team_id = search_team_id AND m.home_score < m.away_score)
        ),
        COUNT(*) FILTER (
            WHERE m.away_team_id = search_team_id AND m.away_score > m.home_score
        ),
        COUNT(*) FILTER (
            WHERE m.away_team_id = search_team_id AND m.away_score < m.home_score
        ),
        COUNT(*) FILTER (
            WHERE m.home_team_id = search_team_id AND m.home_score > m.away_score
        ),
        COUNT(*) FILTER (
            WHERE m.home_team_id = search_team_id AND m.home_score < m.away_score
        )
    FROM phase p
    LEFT JOIN match m
        ON m.phase_id = p.phase_id
        AND (
            m.away_team_id = search_team_id
            OR m.home_team_id = search_team_id
        )
    WHERE p_season_id IS NULL OR p.season_id = p_season_id
    GROUP BY p.phase_id, p.name
    ORDER BY p.phase_id;
$$;

DROP FUNCTION public.get_stadium_attendance();

CREATE FUNCTION public.get_stadium_attendance(p_season_id integer DEFAULT NULL)
    RETURNS TABLE(stadium_name character varying, capacity integer, games_played bigint, total_attendance bigint, attendance_percentage numeric)
    LANGUAGE sql
    AS $$
    SELECT
        s.name,
        s.capacity,
        COUNT(m.match_id),
        COALESCE(SUM(m.attendance), 0),
        ROUND(
            COALESCE(SUM(m.attendance), 0) * 100.0
            / NULLIF(s.capacity * COUNT(m.match_id), 0),
            2
        )
    FROM stadium s
    LEFT JOIN match m
        ON m.stadium_id = s.stadium_id
        AND (
            p_season_id IS NULL
            OR m.phase_id IN (
                SELECT phase_id FROM phase WHERE season_id = p_season_id
            )
        )
    GROUP BY s.stadium_id, s.name, s.capacity
    ORDER BY 5 DESC NULLS LAST;
$$;

DROP FUNCTION public.get_matches_by_teams(integer, integer);

CREATE FUNCTION public.get_matches_by_teams(team_id_1 integer, team_id_2 integer, p_season_id integer DEFAULT NULL)
    RETURNS TABLE(match_id integer, match_date date, away_team character varying, home_team character varying, stadium character varying, phase character varying, away_score integer, home_score integer, attendance integer)
    LANGUAGE sql
    AS $$
    SELECT
        m.match_id,
        m.match_date,
        away.name,
        home.name,
        s.name,
        p.name,
        m.away_score,
        m.home_score,
        m.attendance
    FROM match m
    JOIN team away ON away.team_id = m.away_team_id
    JOIN team home ON home.team_id = m.home_team_id
    JOIN stadium s ON s.stadium_id = m.stadium_id
    JOIN phase p ON p.phase_id = m.phase_id
    WHERE (
            (m.away_team_id = team_id_1 AND m.home_team_id = team_id_2)
            OR
            (m.away_team_id = team_id_2 AND m.home_team_id = team_id_1)
          )
      AND (p_season_id IS NULL OR p.season_id = p_season_id)
    ORDER BY m.match_date;
$$;

DROP FUNCTION public.get_matches_by_date(date, integer);

CREATE FUNCTION public.get_matches_by_date(search_date date, search_stadium_id integer DEFAULT NULL, p_season_id integer DEFAULT NULL)
    RETURNS TABLE(match_id integer, match_date date, away_team character varying, home_team character varying, stadium character varying, phase character varying, away_score integer, home_score integer, attendance integer)
    LANGUAGE sql
    AS $$
    SELECT
        m.match_id,
        m.match_date,
        away.name,
        home.name,
        s.name,
        p.name,
        m.away_score,
        m.home_score,
        m.attendance
    FROM match m
    JOIN team away ON away.team_id = m.away_team_id
    JOIN team home ON home.team_id = m.home_team_id
    JOIN stadium s ON s.stadium_id = m.stadium_id
    JOIN phase p ON p.phase_id = m.phase_id
    WHERE m.match_date = search_date
      AND (search_stadium_id IS NULL OR m.stadium_id = search_stadium_id)
      AND (p_season_id IS NULL OR p.season_id = p_season_id)
    ORDER BY m.match_date;
$$;

DROP FUNCTION search_matches(VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR);

CREATE FUNCTION search_matches(
    p_away_team VARCHAR DEFAULT NULL,
    p_home_team VARCHAR DEFAULT NULL,
    p_match_date DATE DEFAULT NULL,
    p_stadium VARCHAR DEFAULT NULL,
    p_phase VARCHAR DEFAULT NULL,
    p_season_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    match_id INTEGER,
    away_team_id INTEGER,
    away_team_name VARCHAR,
    home_team_id INTEGER,
    home_team_name VARCHAR,
    match_date DATE,
    stadium_id INTEGER,
    stadium_name VARCHAR,
    phase_id INTEGER,
    phase_name VARCHAR,
    away_score INTEGER,
    home_score INTEGER,
    attendance INTEGER,
    tiebreaker BOOLEAN
)
LANGUAGE SQL
AS $$
    SELECT
        m.match_id, away.team_id, away.name, home.team_id, home.name,
        m.match_date, s.stadium_id, s.name, ph.phase_id, ph.name,
        m.away_score, m.home_score, m.attendance, m.tiebreaker
    FROM match m
    INNER JOIN team away ON away.team_id = m.away_team_id
    INNER JOIN team home ON home.team_id = m.home_team_id
    INNER JOIN stadium s ON s.stadium_id = m.stadium_id
    INNER JOIN phase ph ON ph.phase_id = m.phase_id
    WHERE (p_away_team IS NULL OR away.name ILIKE '%' || p_away_team || '%')
      AND (p_home_team IS NULL OR home.name ILIKE '%' || p_home_team || '%')
      AND (p_match_date IS NULL OR m.match_date = p_match_date)
      AND (p_stadium IS NULL OR s.name ILIKE '%' || p_stadium || '%')
      AND (p_phase IS NULL OR ph.name ILIKE '%' || p_phase || '%')
      AND (p_season_id IS NULL OR ph.season_id = p_season_id)
    ORDER BY m.match_date DESC, m.match_id DESC;
$$;

DROP FUNCTION search_phases(VARCHAR, DATE);

CREATE FUNCTION search_phases(
    p_name VARCHAR DEFAULT NULL,
    p_active_date DATE DEFAULT NULL,
    p_season_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    phase_id INTEGER,
    name VARCHAR,
    start_date DATE,
    end_date DATE
)
LANGUAGE SQL
AS $$
    SELECT ph.phase_id, ph.name, ph.start_date, ph.end_date
    FROM phase ph
    WHERE (p_name IS NULL OR ph.name ILIKE '%' || p_name || '%')
      AND (
          p_active_date IS NULL
          OR (ph.start_date <= p_active_date AND ph.end_date >= p_active_date)
      )
      AND (p_season_id IS NULL OR ph.season_id = p_season_id)
    ORDER BY ph.start_date;
$$;
