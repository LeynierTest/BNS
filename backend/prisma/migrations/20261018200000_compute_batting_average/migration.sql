-- El promedio de bateo deja de escribirse a mano: se calcula siempre como
-- hits / veces al bate (redondeado a 3 decimales), así no puede discrepar
-- de esos dos datos. Sin turnos al bate no hay promedio, y el lanzador
-- tampoco lo lleva (su promedio es el ERA, ver get_pitching_stats).

CREATE FUNCTION public.compute_batting_average() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.batting_average := CASE
        WHEN LOWER(NEW.position) = 'lanzador' THEN NULL
        WHEN NEW.at_bats > 0 AND NEW.hits <= NEW.at_bats
            THEN round(NEW.hits::numeric / NEW.at_bats, 3)
        ELSE NULL
    END;

    RETURN NEW;
END;
$$;

-- Los BEFORE triggers se ejecutan por orden alfabético: este corre antes
-- que los validate_* de la tabla.
CREATE TRIGGER compute_batting_average_trigger
    BEFORE INSERT OR UPDATE ON public.player
    FOR EACH ROW EXECUTE FUNCTION public.compute_batting_average();

-- Recalcula el promedio de los jugadores existentes (no lanzadores: uno
-- antiguo sin las estadísticas de pitcheo no pasaría validate_player_stats).
-- Una fila con más hits que turnos queda sin promedio hasta corregirla.
UPDATE public.player
SET batting_average = NULL
WHERE LOWER(position) <> 'lanzador';

-- Después del recálculo: NOT VALID no revisa las filas antiguas, pero sí
-- exige la regla a toda fila nueva o modificada.
ALTER TABLE public.player
    ADD CONSTRAINT player_hits_le_at_bats_ck
    CHECK (hits IS NULL OR at_bats IS NULL OR hits <= at_bats)
    NOT VALID;
