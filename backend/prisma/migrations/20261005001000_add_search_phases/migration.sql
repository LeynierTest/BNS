CREATE OR REPLACE FUNCTION search_phases(
    p_name VARCHAR DEFAULT NULL,
    p_active_date DATE DEFAULT NULL
)
RETURNS TABLE (
    phase_id INTEGER,
    name VARCHAR,
    start_date DATE,
    end_date DATE
)
LANGUAGE SQL
AS $$
    SELECT
        ph.phase_id,
        ph.name,
        ph.start_date,
        ph.end_date
    FROM phase ph
    WHERE
        (
            p_name IS NULL
            OR ph.name ILIKE '%' || p_name || '%'
        )
        AND (
            p_active_date IS NULL
            OR (
                ph.start_date <= p_active_date
                AND ph.end_date >= p_active_date
            )
        )
    ORDER BY ph.start_date;
$$;
