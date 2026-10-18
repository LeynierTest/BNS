-- Estadísticas de lanzador (decisión del equipo, 2026-10-18): el lanzador
-- del equipo todos estrellas se elige por menor ERA y el reporte muestra
-- además WHIP, K/9, BB/9 y FIP. Para eso se registran, solo en lanzadores,
-- hits y bases por bolas permitidos, ponches, jonrones permitidos y
-- pelotazos. Las carreras permitidas cuentan como carreras limpias, y las
-- entradas lanzadas usan la notación de béisbol (90.2 = 90 ⅔).
--
-- Ninguna sentencia depende de los datos existentes: los lanzadores
-- antiguos quedan con los campos nuevos vacíos (ERA sí, el resto no) y
-- deben completarse al editarlos.

ALTER TABLE public.player
    ADD COLUMN hits_allowed INTEGER,
    ADD COLUMN walks_allowed INTEGER,
    ADD COLUMN strikeouts INTEGER,
    ADD COLUMN home_runs_allowed INTEGER,
    ADD COLUMN hit_batsmen INTEGER,
    ADD CONSTRAINT player_hits_allowed_ck
        CHECK (hits_allowed IS NULL OR hits_allowed >= 0),
    ADD CONSTRAINT player_walks_allowed_ck
        CHECK (walks_allowed IS NULL OR walks_allowed >= 0),
    ADD CONSTRAINT player_strikeouts_ck
        CHECK (strikeouts IS NULL OR strikeouts >= 0),
    ADD CONSTRAINT player_home_runs_allowed_ck
        CHECK (home_runs_allowed IS NULL OR home_runs_allowed >= 0),
    ADD CONSTRAINT player_hit_batsmen_ck
        CHECK (hit_batsmen IS NULL OR hit_batsmen >= 0),
    -- Todo jonrón es un hit.
    ADD CONSTRAINT player_home_runs_le_hits_ck
        CHECK (home_runs_allowed IS NULL OR hits_allowed IS NULL
               OR home_runs_allowed <= hits_allowed);

-- NOT VALID: se exige a toda fila nueva o modificada sin rechazar la
-- migración si alguna fila antigua usó décimas (p. ej. 90.5).
ALTER TABLE public.player
    ADD CONSTRAINT player_innings_pitched_notation_ck
    CHECK (
        innings_pitched IS NULL
        OR (
            innings_pitched = trunc(innings_pitched, 1)
            AND mod(innings_pitched * 10, 10) <= 2
        )
    )
    NOT VALID;

CREATE OR REPLACE FUNCTION public.validate_player_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF LOWER(NEW.position) = 'lanzador' THEN

        IF NEW.innings_pitched IS NULL
           OR NEW.runs_allowed IS NULL
           OR NEW.hits_allowed IS NULL
           OR NEW.walks_allowed IS NULL
           OR NEW.strikeouts IS NULL
           OR NEW.home_runs_allowed IS NULL
           OR NEW.hit_batsmen IS NULL
           OR NEW.at_bats IS NOT NULL
           OR NEW.hits IS NOT NULL THEN

            RAISE EXCEPTION
                'Los lanzadores deben tener entradas lanzadas, carreras permitidas, hits permitidos, bases por bolas, ponches, jonrones permitidos y pelotazos, y no pueden tener turnos al bate ni hits';
        END IF;

    ELSE

        IF NEW.at_bats IS NULL
           OR NEW.hits IS NULL
           OR NEW.innings_pitched IS NOT NULL
           OR NEW.runs_allowed IS NOT NULL
           OR NEW.hits_allowed IS NOT NULL
           OR NEW.walks_allowed IS NOT NULL
           OR NEW.strikeouts IS NOT NULL
           OR NEW.home_runs_allowed IS NOT NULL
           OR NEW.hit_batsmen IS NOT NULL THEN

            RAISE EXCEPTION
                'Los jugadores que no son lanzadores deben tener turnos al bate y hits, y no pueden tener estadísticas de lanzador';
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 90.2 (notación de béisbol) → 90.6667 entradas reales.
CREATE FUNCTION public.innings_to_decimal(innings numeric) RETURNS numeric
    LANGUAGE sql
    IMMUTABLE
    AS $$
    SELECT trunc(innings) + (innings - trunc(innings)) * 10 / 3;
$$;

-- Estadísticas de cada lanzador con entradas lanzadas (E = entradas reales):
--   ERA  = 9·carreras / E          WHIP = (hits + bases por bolas) / E
--   K/9  = 9·ponches / E           BB/9 = 9·bases por bolas / E
--   FIP  = (13·HR + 3·(BB + pelotazos) − 2·K) / E + constante
-- La constante del FIP se calcula con los totales de todos los lanzadores
-- con datos completos para que el FIP de la liga sea igual a su ERA
-- (definición estándar). Sin entradas no hay estadísticas, y tampoco si
-- una fila antigua usó décimas (p. ej. 45.5): mejor no mostrar un ERA que
-- mostrar uno falso; al corregir el dato vuelve a contar.
CREATE FUNCTION public.get_pitching_stats()
    RETURNS TABLE(
        team_member_id integer,
        innings numeric,
        era numeric,
        whip numeric,
        k_per_9 numeric,
        bb_per_9 numeric,
        fip numeric
    )
    LANGUAGE sql
    STABLE
    AS $$
    WITH pitchers AS (
        SELECT
            p.team_member_id,
            public.innings_to_decimal(p.innings_pitched) AS ip,
            p.runs_allowed AS er,
            p.hits_allowed AS h,
            p.walks_allowed AS bb,
            p.strikeouts AS k,
            p.home_runs_allowed AS hr,
            p.hit_batsmen AS hbp
        FROM player p
        WHERE LOWER(p.position) = 'lanzador'
          AND p.innings_pitched > 0
          AND p.innings_pitched = trunc(p.innings_pitched, 1)
          AND mod(p.innings_pitched * 10, 10) <= 2
    ),
    league AS (
        SELECT
            9 * SUM(er) / SUM(ip)
            - (13 * SUM(hr) + 3 * (SUM(bb) + SUM(hbp)) - 2 * SUM(k)) / SUM(ip)
                AS fip_constant
        FROM pitchers
        WHERE h IS NOT NULL
          AND bb IS NOT NULL
          AND k IS NOT NULL
          AND hr IS NOT NULL
          AND hbp IS NOT NULL
    )
    SELECT
        pitchers.team_member_id,
        round(pitchers.ip, 2),
        round(9 * pitchers.er / pitchers.ip, 2),
        round((pitchers.h + pitchers.bb) / pitchers.ip, 2),
        round(9 * pitchers.k / pitchers.ip, 2),
        round(9 * pitchers.bb / pitchers.ip, 2),
        round(
            (13 * pitchers.hr + 3 * (pitchers.bb + pitchers.hbp) - 2 * pitchers.k)
                / pitchers.ip
            + league.fip_constant,
            2
        )
    FROM pitchers
    CROSS JOIN league;
$$;

-- Reporte 7: un jugador por posición. Lanzadores: menor ERA (si empatan,
-- más entradas lanzadas); resto: mayor promedio de bateo. El nombre deja
-- el resultado determinista ante empates exactos. Cambian las columnas de
-- salida, así que hay que recrear la función.
DROP FUNCTION public.get_all_star_team();

CREATE FUNCTION public.get_all_star_team()
    RETURNS TABLE(
        player_position character varying,
        player_name character varying,
        team_name character varying,
        batting_average numeric,
        era numeric,
        whip numeric,
        k_per_9 numeric,
        bb_per_9 numeric,
        fip numeric
    )
    LANGUAGE sql
    STABLE
    AS $$
    SELECT
        ranked.player_position,
        ranked.player_name,
        ranked.team_name,
        ranked.batting_average,
        ranked.era,
        ranked.whip,
        ranked.k_per_9,
        ranked.bb_per_9,
        ranked.fip
    FROM (
        SELECT
            p.position AS player_position,
            tm.name AS player_name,
            t.name AS team_name,
            CASE WHEN LOWER(p.position) = 'lanzador'
                THEN NULL
                ELSE p.batting_average
            END AS batting_average,
            stats.era,
            stats.whip,
            stats.k_per_9,
            stats.bb_per_9,
            stats.fip,
            ROW_NUMBER() OVER (
                PARTITION BY p.position
                ORDER BY
                    stats.era ASC NULLS LAST,
                    stats.innings DESC NULLS LAST,
                    CASE WHEN LOWER(p.position) = 'lanzador'
                        THEN NULL
                        ELSE p.batting_average
                    END DESC NULLS LAST,
                    tm.name
            ) AS position_rank
        FROM player p
        JOIN team_member tm
            ON tm.team_member_id = p.team_member_id
        JOIN team t
            ON t.team_id = tm.team_id
        LEFT JOIN public.get_pitching_stats() stats
            ON stats.team_member_id = p.team_member_id
        WHERE CASE WHEN LOWER(p.position) = 'lanzador'
            THEN stats.era IS NOT NULL
            ELSE p.batting_average IS NOT NULL
        END
    ) ranked
    WHERE ranked.position_rank = 1
    ORDER BY ranked.player_position;
$$;

-- search_players devuelve también las estadísticas nuevas (el formulario de
-- edición se rellena desde los resultados de búsqueda).
DROP FUNCTION search_players(INTEGER, VARCHAR, VARCHAR, VARCHAR);

CREATE FUNCTION search_players(
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
    batting_average NUMERIC(5,3),
    hits_allowed INTEGER,
    walks_allowed INTEGER,
    strikeouts INTEGER,
    home_runs_allowed INTEGER,
    hit_batsmen INTEGER
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
        p.batting_average,
        p.hits_allowed,
        p.walks_allowed,
        p.strikeouts,
        p.home_runs_allowed,
        p.hit_batsmen
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
