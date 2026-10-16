CREATE OR REPLACE FUNCTION search_stadiums(
    p_name VARCHAR DEFAULT NULL,
    p_province VARCHAR DEFAULT NULL,
    p_capacity INTEGER DEFAULT NULL
)
RETURNS TABLE (
    stadium_id INTEGER,
    name VARCHAR,
    capacity INTEGER,
    province VARCHAR
)
LANGUAGE SQL
AS $$
    SELECT
        s.stadium_id,
        s.name,
        s.capacity,
        s.province
    FROM stadium s
    WHERE
        (p_name IS NULL OR s.name ILIKE '%' || p_name || '%')
        AND (p_province IS NULL OR s.province ILIKE '%' || p_province || '%')
        AND (
            p_capacity IS NULL
            OR s.capacity = p_capacity
        )
    ORDER BY s.name;
$$;
