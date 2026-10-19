-- Temporadas (decisión del equipo, 2026-10-18): una Serie es la competición
-- (p. ej. "Serie Nacional de Béisbol") y se juega en temporadas. Cada
-- temporada tiene sus fases y partidos, e inscribe a los equipos que la
-- juegan. Equipos, peloteros, entrenadores y estadios son comunes a todas.
--
-- Los datos que ya existían pasan a "Serie Nacional de Béisbol — Temporada 1",
-- con todos los equipos inscritos.

CREATE TABLE public.series (
    series_id integer GENERATED ALWAYS AS IDENTITY,
    name character varying(100) NOT NULL,
    CONSTRAINT series_pkey PRIMARY KEY (series_id),
    CONSTRAINT series_name_uq UNIQUE (name)
);

CREATE TABLE public.season (
    season_id integer GENERATED ALWAYS AS IDENTITY,
    series_id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT season_pkey PRIMARY KEY (season_id),
    CONSTRAINT season_series_name_uq UNIQUE (series_id, name),
    CONSTRAINT season_series_fk FOREIGN KEY (series_id)
        REFERENCES public.series (series_id)
);

-- Equipos inscritos en cada temporada.
CREATE TABLE public.season_team (
    season_id integer NOT NULL,
    team_id integer NOT NULL,
    CONSTRAINT season_team_pkey PRIMARY KEY (season_id, team_id),
    CONSTRAINT season_team_season_fk FOREIGN KEY (season_id)
        REFERENCES public.season (season_id) ON DELETE CASCADE,
    CONSTRAINT season_team_team_fk FOREIGN KEY (team_id)
        REFERENCES public.team (team_id) ON DELETE CASCADE
);

CREATE INDEX season_team_team_idx ON public.season_team (team_id);

INSERT INTO public.series (name) VALUES ('Serie Nacional de Béisbol');

INSERT INTO public.season (series_id, name)
SELECT series_id, 'Temporada 1' FROM public.series;

INSERT INTO public.season_team (season_id, team_id)
SELECT season.season_id, team.team_id
FROM public.season CROSS JOIN public.team;

-- Cada fase pertenece a una temporada; sus nombres se repiten de una
-- temporada a otra, pero no dentro de la misma.
ALTER TABLE public.phase ADD COLUMN season_id integer;

UPDATE public.phase SET season_id = (SELECT MIN(season_id) FROM public.season);

ALTER TABLE public.phase
    ALTER COLUMN season_id SET NOT NULL,
    ADD CONSTRAINT phase_season_fk FOREIGN KEY (season_id)
        REFERENCES public.season (season_id),
    DROP CONSTRAINT phase_name_uq,
    ADD CONSTRAINT phase_season_name_uq UNIQUE (season_id, name);
