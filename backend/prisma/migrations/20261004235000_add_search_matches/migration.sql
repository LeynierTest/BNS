CREATE OR REPLACE FUNCTION search_matches(
    p_away_team VARCHAR DEFAULT NULL,
    p_home_team VARCHAR DEFAULT NULL,
    p_match_date DATE DEFAULT NULL,
    p_stadium VARCHAR DEFAULT NULL,
    p_phase VARCHAR DEFAULT NULL
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
    attendance INTEGER
)
LANGUAGE SQL
AS $$
    SELECT
        m.match_id,
        away.team_id,
        away.name,
        home.team_id,
        home.name,
        m.match_date,
        s.stadium_id,
        s.name,
        ph.phase_id,
        ph.name,
        m.away_score,
        m.home_score,
        m.attendance
    FROM match m
    INNER JOIN team away
        ON away.team_id = m.away_team_id
    INNER JOIN team home
        ON home.team_id = m.home_team_id
    INNER JOIN stadium s
        ON s.stadium_id = m.stadium_id
    INNER JOIN phase ph
        ON ph.phase_id = m.phase_id
    WHERE
        (
            p_away_team IS NULL
            OR away.name ILIKE '%' || p_away_team || '%'
        )
        AND (
            p_home_team IS NULL
            OR home.name ILIKE '%' || p_home_team || '%'
        )
        AND (
            p_match_date IS NULL
            OR m.match_date = p_match_date
        )
        AND (
            p_stadium IS NULL
            OR s.name ILIKE '%' || p_stadium || '%'
        )
        AND (
            p_phase IS NULL
            OR ph.name ILIKE '%' || p_phase || '%'
        )
    ORDER BY m.match_date DESC, m.match_id DESC;
$$;
