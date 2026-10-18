-- Regla 8/4/2 (README): las fases de la Serie son las cuatro del enunciado,
-- cada una una sola vez, y los partidos de desempate del corte se marcan.
--
-- Si esta migración falla en phase_name_uq es porque la base tiene dos fases
-- con el mismo nombre: renombra o elimina la sobrante y vuelve a aplicarla
-- (`npx prisma migrate resolve --rolled-back 20261018120000_add_phase_qualification`
-- y después `npx prisma migrate deploy`). Prisma no ejecuta la migración en
-- una transacción, por eso esa restricción va primero: si falla, no se ha
-- aplicado nada y se puede reintentar.

ALTER TABLE ONLY public.phase
    ADD CONSTRAINT phase_name_uq UNIQUE (name);

ALTER TABLE public.match
    ADD COLUMN tiebreaker BOOLEAN NOT NULL DEFAULT false;

-- NOT VALID: se exige a toda fila nueva o modificada sin rechazar la
-- migración en bases con fases antiguas de nombre libre.
ALTER TABLE public.phase
    ADD CONSTRAINT phase_name_ck
    CHECK (name IN ('Primera Ronda', 'Segunda Ronda', 'Play Off', 'Final'))
    NOT VALID;

-- search_matches devuelve también si el partido es de desempate (cambiar
-- las columnas de salida obliga a recrear la función).
DROP FUNCTION search_matches(VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR);

CREATE FUNCTION search_matches(
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
    attendance INTEGER,
    tiebreaker BOOLEAN
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
        m.attendance,
        m.tiebreaker
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
