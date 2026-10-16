CREATE OR REPLACE FUNCTION search_players(
    p_number INTEGER DEFAULT NULL,
    p_name VARCHAR DEFAULT NULL,
    p_team VARCHAR DEFAULT NULL,
    p_position VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    team_member_id INTEGER,
    number INTEGER,
    name VARCHAR,
    team_id INTEGER,
    team_name VARCHAR,
    player_position VARCHAR,
    years_on_team INTEGER,
    at_bats INTEGER,
    innings_pitched NUMERIC(6,2),
    hits INTEGER,
    runs_allowed INTEGER,
    batting_average NUMERIC(5,3)
)
LANGUAGE SQL
AS $$
    SELECT
        tm.team_member_id,
        tm.number,
        tm.name,
        tm.team_id,
        t.name,
        p.position,
        tm.years_on_team,
        p.at_bats,
        p.innings_pitched,
        p.hits,
        p.runs_allowed,
        p.batting_average
    FROM player p
    INNER JOIN team_member tm
        ON tm.team_member_id = p.team_member_id
    INNER JOIN team t
        ON t.team_id = tm.team_id
    WHERE
        (
            p_number IS NULL
            OR tm.number = p_number
        )
        AND (
            p_name IS NULL
            OR tm.name ILIKE '%' || p_name || '%'
        )
        AND (
            p_team IS NULL
            OR t.name ILIKE '%' || p_team || '%'
        )
        AND (
            p_position IS NULL
            OR p.position ILIKE '%' || p_position || '%'
        )
    ORDER BY tm.name;
$$;
