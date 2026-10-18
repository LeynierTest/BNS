-- Baseline generado con pg_dump 18 y ajustado para que Prisma Migrate lo ejecute
-- en una base nueva (PostgreSQL 16+):
--   * sin los meta-comandos de psql \restrict / \unrestrict (no son SQL);
--   * sin SET transaction_timeout (parámetro que solo existe desde PostgreSQL 17);
--   * sin vaciar search_path, para que el seed de roles y las migraciones
--     siguientes resuelvan el esquema public;
--   * seed de roles con OVERRIDING SYSTEM VALUE (role_id es GENERATED ALWAYS).
-- No regenerar este archivo con pg_dump sin repetir estos ajustes.

--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: get_all_star_team(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_star_team() RETURNS TABLE(player_position character varying, player_name character varying, team_name character varying, batting_average numeric)
    LANGUAGE sql
    AS $$
    SELECT
        ranked.player_position,
        ranked.player_name,
        ranked.team_name,
        ranked.batting_average
    FROM (
        SELECT
            p.position AS player_position,
            tm.name AS player_name,
            t.name AS team_name,
            p.batting_average,
            ROW_NUMBER() OVER (
                PARTITION BY p.position
                ORDER BY p.batting_average DESC
            ) AS position_rank
        FROM player p
        JOIN team_member tm
            ON tm.team_member_id = p.team_member_id
        JOIN team t
            ON t.team_id = tm.team_id
        WHERE p.batting_average IS NOT NULL
    ) ranked
    WHERE ranked.position_rank = 1
    ORDER BY ranked.player_position;
$$;


--
-- Name: get_matches_by_date(date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_matches_by_date(search_date date, search_stadium_id integer DEFAULT NULL::integer) RETURNS TABLE(match_id integer, match_date date, away_team character varying, home_team character varying, stadium character varying, phase character varying, away_score integer, home_score integer, attendance integer)
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
    JOIN team away
        ON away.team_id = m.away_team_id
    JOIN team home
        ON home.team_id = m.home_team_id
    JOIN stadium s
        ON s.stadium_id = m.stadium_id
    JOIN phase p
        ON p.phase_id = m.phase_id
    WHERE m.match_date = search_date
      AND (
          search_stadium_id IS NULL
          OR m.stadium_id = search_stadium_id
      )
    ORDER BY m.match_date;
$$;


--
-- Name: get_matches_by_teams(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_matches_by_teams(team_id_1 integer, team_id_2 integer) RETURNS TABLE(match_id integer, match_date date, away_team character varying, home_team character varying, stadium character varying, phase character varying, away_score integer, home_score integer, attendance integer)
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
    JOIN team away
        ON away.team_id = m.away_team_id
    JOIN team home
        ON home.team_id = m.home_team_id
    JOIN stadium s
        ON s.stadium_id = m.stadium_id
    JOIN phase p
        ON p.phase_id = m.phase_id
    WHERE
        (m.away_team_id = team_id_1 AND m.home_team_id = team_id_2)
        OR
        (m.away_team_id = team_id_2 AND m.home_team_id = team_id_1)
    ORDER BY m.match_date;
$$;


--
-- Name: get_stadium_attendance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_stadium_attendance() RETURNS TABLE(stadium_name character varying, capacity integer, games_played bigint, total_attendance bigint, attendance_percentage numeric)
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
    GROUP BY s.stadium_id, s.name, s.capacity
    ORDER BY 5 DESC NULLS LAST;
$$;


--
-- Name: get_standings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_standings() RETURNS TABLE(team_id integer, team_name character varying, games_played bigint, points bigint)
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
        ON m.home_team_id = t.team_id
        OR m.away_team_id = t.team_id
    GROUP BY t.team_id, t.name
    ORDER BY 4 DESC, t.name;
$$;


--
-- Name: get_team_status(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_team_status(search_team_id integer) RETURNS TABLE(phase_name character varying, games_won_total bigint, games_lost_total bigint, games_won_away bigint, games_lost_away bigint, games_won_home bigint, games_lost_home bigint)
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
            WHERE
                m.away_team_id = search_team_id
                AND m.away_score > m.home_score
        ),

        COUNT(*) FILTER (
            WHERE
                m.away_team_id = search_team_id
                AND m.away_score < m.home_score
        ),

        COUNT(*) FILTER (
            WHERE
                m.home_team_id = search_team_id
                AND m.home_score > m.away_score
        ),

        COUNT(*) FILTER (
            WHERE
                m.home_team_id = search_team_id
                AND m.home_score < m.away_score
        )

    FROM phase p
    LEFT JOIN match m
        ON m.phase_id = p.phase_id
        AND (
            m.away_team_id = search_team_id
            OR m.home_team_id = search_team_id
        )
    GROUP BY p.phase_id, p.name
    ORDER BY p.phase_id;
$$;


--
-- Name: get_top_coaches(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_coaches() RETURNS TABLE(team_name character varying, coach_name character varying, jersey_number integer, years_experience integer)
    LANGUAGE sql
    AS $$
    SELECT
        t.name,
        tm.name,
        tm.number,
        c.years_experience
    FROM (
        SELECT
            tm.team_member_id,
            ROW_NUMBER() OVER (
                PARTITION BY tm.team_id
                ORDER BY c.years_experience DESC
            ) AS position
        FROM team_member tm
        JOIN coach c
            ON c.team_member_id = tm.team_member_id
    ) ranked
    JOIN team_member tm
        ON tm.team_member_id = ranked.team_member_id
    JOIN coach c
        ON c.team_member_id = tm.team_member_id
    JOIN team t
        ON t.team_id = tm.team_id
    WHERE ranked.position <= 3
    ORDER BY
        t.championships_won DESC,
        t.name,
        c.years_experience DESC;
$$;


--
-- Name: validate_coach_player_exclusivity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_coach_player_exclusivity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM player
        WHERE team_member_id = NEW.team_member_id
    ) THEN
        RAISE EXCEPTION
            'A team member cannot be both a coach and a player';
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: validate_match_attendance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_match_attendance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    stadium_capacity INTEGER;
BEGIN
    SELECT capacity
    INTO stadium_capacity
    FROM stadium
    WHERE stadium_id = NEW.stadium_id;

    IF NEW.attendance > stadium_capacity THEN
        RAISE EXCEPTION
            'Attendance (%) cannot exceed stadium capacity (%)',
            NEW.attendance,
            stadium_capacity;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: validate_match_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_match_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    phase_start DATE;
    phase_end DATE;
BEGIN
    SELECT start_date, end_date
    INTO phase_start, phase_end
    FROM phase
    WHERE phase_id = NEW.phase_id;

    IF NEW.match_date < phase_start
       OR NEW.match_date > phase_end THEN
        RAISE EXCEPTION
            'Match date % is outside the phase period (% to %)',
            NEW.match_date,
            phase_start,
            phase_end;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: validate_player_coach_exclusivity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_player_coach_exclusivity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM coach
        WHERE team_member_id = NEW.team_member_id
    ) THEN
        RAISE EXCEPTION
            'A team member cannot be both a player and a coach';
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: validate_player_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_player_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF LOWER(NEW.position) = 'lanzador' THEN

        IF NEW.innings_pitched IS NULL
           OR NEW.runs_allowed IS NULL
           OR NEW.at_bats IS NOT NULL
           OR NEW.hits IS NOT NULL THEN

            RAISE EXCEPTION
                'Pitchers must have innings_pitched and runs_allowed, and cannot have at_bats or hits';
        END IF;

    ELSE

        IF NEW.at_bats IS NULL
           OR NEW.hits IS NULL
           OR NEW.innings_pitched IS NOT NULL
           OR NEW.runs_allowed IS NOT NULL THEN

            RAISE EXCEPTION
                'Non-pitchers must have at_bats and hits, and cannot have innings_pitched or runs_allowed';
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: app_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.app_user ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.app_user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coach; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coach (
    team_member_id integer NOT NULL,
    years_experience integer NOT NULL,
    CONSTRAINT coach_years_experience_ck CHECK ((years_experience >= 0))
);


--
-- Name: match; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match (
    match_id integer NOT NULL,
    away_team_id integer NOT NULL,
    home_team_id integer NOT NULL,
    match_date date NOT NULL,
    stadium_id integer NOT NULL,
    phase_id integer NOT NULL,
    away_score integer NOT NULL,
    home_score integer NOT NULL,
    attendance integer NOT NULL,
    CONSTRAINT match_attendance_ck CHECK ((attendance >= 0)),
    CONSTRAINT match_away_score_ck CHECK ((away_score >= 0)),
    CONSTRAINT match_home_score_ck CHECK ((home_score >= 0)),
    CONSTRAINT match_teams_different_ck CHECK ((away_team_id <> home_team_id))
);


--
-- Name: match_match_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.match ALTER COLUMN match_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.match_match_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: phase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phase (
    phase_id integer NOT NULL,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    CONSTRAINT phase_dates_ck CHECK ((end_date >= start_date))
);


--
-- Name: phase_phase_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.phase ALTER COLUMN phase_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.phase_phase_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: player; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player (
    team_member_id integer NOT NULL,
    "position" character varying(50) NOT NULL,
    at_bats integer,
    innings_pitched numeric(6,2),
    hits integer,
    runs_allowed integer,
    batting_average numeric(5,3),
    CONSTRAINT player_at_bats_ck CHECK (((at_bats IS NULL) OR (at_bats >= 0))),
    CONSTRAINT player_batting_average_ck CHECK (((batting_average IS NULL) OR (batting_average >= (0)::numeric))),
    CONSTRAINT player_hits_ck CHECK (((hits IS NULL) OR (hits >= 0))),
    CONSTRAINT player_innings_pitched_ck CHECK (((innings_pitched IS NULL) OR (innings_pitched >= (0)::numeric))),
    CONSTRAINT player_runs_allowed_ck CHECK (((runs_allowed IS NULL) OR (runs_allowed >= 0)))
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    role_id integer NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.role ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.role_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: stadium; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stadium (
    stadium_id integer NOT NULL,
    name character varying(150) NOT NULL,
    capacity integer NOT NULL,
    province character varying(100) NOT NULL,
    CONSTRAINT stadium_capacity_ck CHECK ((capacity > 0))
);


--
-- Name: stadium_stadium_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.stadium ALTER COLUMN stadium_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.stadium_stadium_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    team_id integer NOT NULL,
    name character varying(100) NOT NULL,
    province character varying(100) NOT NULL,
    championships_participated integer NOT NULL,
    championships_won integer NOT NULL,
    mascot character varying(100) NOT NULL,
    color character varying(50) NOT NULL,
    CONSTRAINT team_championships_participated_ck CHECK ((championships_participated >= 0)),
    CONSTRAINT team_championships_won_ck CHECK ((championships_won >= 0)),
    CONSTRAINT team_championships_won_le_participated_ck CHECK ((championships_won <= championships_participated))
);


--
-- Name: team_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_member (
    team_member_id integer NOT NULL,
    name character varying(150) NOT NULL,
    number integer NOT NULL,
    years_on_team integer NOT NULL,
    team_id integer NOT NULL,
    CONSTRAINT team_member_number_ck CHECK ((number > 0)),
    CONSTRAINT team_member_years_on_team_ck CHECK ((years_on_team >= 0))
);


--
-- Name: team_member_team_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.team_member ALTER COLUMN team_member_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.team_member_team_member_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: team_team_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.team ALTER COLUMN team_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.team_team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_user app_user_email_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_uq UNIQUE (email);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (user_id);


--
-- Name: app_user app_user_username_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_username_uq UNIQUE (username);


--
-- Name: coach coach_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach
    ADD CONSTRAINT coach_pkey PRIMARY KEY (team_member_id);


--
-- Name: match match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_pkey PRIMARY KEY (match_id);


--
-- Name: phase phase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phase
    ADD CONSTRAINT phase_pkey PRIMARY KEY (phase_id);


--
-- Name: player player_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_pkey PRIMARY KEY (team_member_id);


--
-- Name: role role_name_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_name_uq UNIQUE (name);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- Name: stadium stadium_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadium
    ADD CONSTRAINT stadium_pkey PRIMARY KEY (stadium_id);


--
-- Name: team_member team_member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_pkey PRIMARY KEY (team_member_id);


--
-- Name: team_member team_member_team_number_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_team_number_uq UNIQUE (team_id, number);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (team_id);


--
-- Name: coach validate_coach_player_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_coach_player_trigger BEFORE INSERT OR UPDATE ON public.coach FOR EACH ROW EXECUTE FUNCTION public.validate_coach_player_exclusivity();


--
-- Name: match validate_match_attendance_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_match_attendance_trigger BEFORE INSERT OR UPDATE OF attendance, stadium_id ON public.match FOR EACH ROW EXECUTE FUNCTION public.validate_match_attendance();


--
-- Name: match validate_match_date_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_match_date_trigger BEFORE INSERT OR UPDATE OF match_date, phase_id ON public.match FOR EACH ROW EXECUTE FUNCTION public.validate_match_date();


--
-- Name: player validate_player_coach_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_player_coach_trigger BEFORE INSERT OR UPDATE ON public.player FOR EACH ROW EXECUTE FUNCTION public.validate_player_coach_exclusivity();


--
-- Name: player validate_player_stats_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_player_stats_trigger BEFORE INSERT OR UPDATE ON public.player FOR EACH ROW EXECUTE FUNCTION public.validate_player_stats();


--
-- Name: app_user app_user_role_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_role_fk FOREIGN KEY (role_id) REFERENCES public.role(role_id);


--
-- Name: coach coach_team_member_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coach
    ADD CONSTRAINT coach_team_member_fk FOREIGN KEY (team_member_id) REFERENCES public.team_member(team_member_id) ON DELETE CASCADE;


--
-- Name: match match_away_team_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_away_team_fk FOREIGN KEY (away_team_id) REFERENCES public.team(team_id);


--
-- Name: match match_home_team_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_home_team_fk FOREIGN KEY (home_team_id) REFERENCES public.team(team_id);


--
-- Name: match match_phase_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_phase_fk FOREIGN KEY (phase_id) REFERENCES public.phase(phase_id);


--
-- Name: match match_stadium_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match
    ADD CONSTRAINT match_stadium_fk FOREIGN KEY (stadium_id) REFERENCES public.stadium(stadium_id);


--
-- Name: player player_team_member_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_team_member_fk FOREIGN KEY (team_member_id) REFERENCES public.team_member(team_member_id) ON DELETE CASCADE;


--
-- Name: team_member team_member_team_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_team_fk FOREIGN KEY (team_id) REFERENCES public.team(team_id);


--
-- PostgreSQL database dump complete
--


INSERT INTO public.role (role_id, name)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Administrator'),
    (2, 'User')
ON CONFLICT (role_id) DO NOTHING;

SELECT pg_catalog.setval(
    pg_catalog.pg_get_serial_sequence('public.role', 'role_id'),
    (SELECT MAX(role_id) FROM public.role)
);
