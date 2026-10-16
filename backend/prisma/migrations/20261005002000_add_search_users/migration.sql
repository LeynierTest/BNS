CREATE OR REPLACE FUNCTION search_users(
    p_username VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT NULL,
    p_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    user_id INTEGER,
    username VARCHAR,
    email VARCHAR,
    active BOOLEAN,
    role_id INTEGER,
    role_name VARCHAR
)
LANGUAGE SQL
AS $$
    SELECT
        u.user_id,
        u.username,
        u.email,
        u.active,
        r.role_id,
        r.name
    FROM app_user u
    INNER JOIN role r
        ON r.role_id = u.role_id
    WHERE
        (
            p_username IS NULL
            OR u.username ILIKE '%' || p_username || '%'
        )
        AND (
            p_email IS NULL
            OR u.email ILIKE '%' || p_email || '%'
        )
        AND (
            p_role IS NULL
            OR r.name ILIKE '%' || p_role || '%'
        )
        AND (
            p_active IS NULL
            OR u.active = p_active
        )
    ORDER BY u.username;
$$;
