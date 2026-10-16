CREATE OR REPLACE FUNCTION search_coaches(
    p_number INTEGER DEFAULT NULL,
    p_name VARCHAR DEFAULT NULL,
    p_team VARCHAR DEFAULT NULL,
    p_years_on_team INTEGER DEFAULT NULL,
    p_years_experience INTEGER DEFAULT NULL
)
RETURNS TABLE (
    team_member_id INTEGER,
    number INTEGER,
    name VARCHAR,
    team_id INTEGER,
    team_name VARCHAR,
    years_on_team INTEGER,
    years_experience INTEGER
)
LANGUAGE SQL
AS $$
    SELECT
        tm.team_member_id,
        tm.number,
        tm.name,
        tm.team_id,
        t.name,
        tm.years_on_team,
        c.years_experience
    FROM coach c
    INNER JOIN team_member tm
        ON tm.team_member_id = c.team_member_id
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
            p_years_on_team IS NULL
            OR tm.years_on_team = p_years_on_team
        )
        AND (
            p_years_experience IS NULL
            OR c.years_experience = p_years_experience
        )
    ORDER BY tm.name;
$$;
