CREATE OR REPLACE FUNCTION search_teams(
    p_name VARCHAR DEFAULT NULL,
    p_province VARCHAR DEFAULT NULL,
    p_color VARCHAR DEFAULT NULL,
    p_mascot VARCHAR DEFAULT NULL,
    p_championships_participated INTEGER DEFAULT NULL,
    p_championships_won INTEGER DEFAULT NULL
)
RETURNS TABLE (
    team_id INTEGER,
    name VARCHAR,
    province VARCHAR,
    championships_participated INTEGER,
    championships_won INTEGER,
    mascot VARCHAR,
    color VARCHAR
)
LANGUAGE SQL
AS $$
    SELECT
        t.team_id,
        t.name,
        t.province,
        t.championships_participated,
        t.championships_won,
        t.mascot,
        t.color
    FROM team t
    WHERE
        (p_name IS NULL OR t.name ILIKE '%' || p_name || '%')
        AND (p_province IS NULL OR t.province ILIKE '%' || p_province || '%')
        AND (p_color IS NULL OR t.color ILIKE '%' || p_color || '%')
        AND (p_mascot IS NULL OR t.mascot ILIKE '%' || p_mascot || '%')
        AND (
            p_championships_participated IS NULL
            OR t.championships_participated = p_championships_participated
        )
        AND (
            p_championships_won IS NULL
            OR t.championships_won = p_championships_won
        )
    ORDER BY t.name;
$$;
