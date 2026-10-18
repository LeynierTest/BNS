export const resources = {
  es: {
    translation: {
      common: {
        language: 'Idioma',
        spanish: 'Español',
        english: 'Inglés',

        roles: {
          administrator: 'Administrador',
          user: 'Usuario',
        },
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        save: 'Guardar',
        edit: 'Editar',
        delete: 'Eliminar',
        retry: 'Reintentar',
        unknownError: 'Ocurrió un error inesperado.',
      },

      profile: {
        changePhoto: 'Cambiar foto de perfil',
        removePhoto: 'Quitar foto de perfil',
        invalidType:
          'Formato no válido. Usa JPG, PNG o WebP.',
        tooLarge:
          'La imagen supera el tamaño máximo de 5 MB.',
        uploadError:
          'No se pudo subir la foto. Inténtalo de nuevo.',
      },

      errors: {
        forbiddenTitle: 'Acceso denegado',
        forbiddenDescription:
          'No tienes permisos para acceder a esta sección.',
        notFoundTitle: 'Página no encontrada',
        notFoundDescription:
          'La página que buscas no existe o ya no está disponible.',
        backToDashboard: 'Volver al inicio',
      },

      navigation: {
        competition: 'Competición',
        reports: 'Reportes',
        administration: 'Administración',
        dashboard: 'Inicio',
        teams: 'Equipos',
        players: 'Peloteros',
        coaches: 'Entrenadores',
        matches: 'Partidos',
        stadiums: 'Estadios',
        phases: 'Fases',
        reportStandings: 'Tabla de posiciones',
        reportMatchesByTeams: 'Partidos por equipos',
        reportMatchesByDate: 'Partidos por fecha',
        reportTopCoaches: 'Entrenadores con más experiencia',
        reportStadiumAttendance: 'Estadios con mayor audiencia',
        reportTeamStatus: 'Estado de un equipo',
        reportAllStar: 'Equipo Todos Estrellas',
        users: 'Usuarios',
        logout: 'Cerrar sesión',
      },

      header: {
        league: 'Serie Nacional de Béisbol',
        title: 'Portal de información',
      },

      reportEmail: {
        button: 'Enviar por correo',
        title: 'Enviar reporte por correo',
        recipient: 'Correo electrónico',
        placeholder: 'ejemplo@correo.com',
        required: 'Introduce un correo electrónico.',
        invalid: 'Introduce un correo electrónico válido.',
        error: 'No se pudo enviar el reporte por correo.',
        cancel: 'Cancelar',
        send: 'Enviar',
        sending: 'Enviando...',
        close: 'Cerrar',
      },
      reportPdf: {
        download: 'Descargar PDF',
        generating: 'Generando PDF...',
        error: 'No se pudo generar el PDF.',
      },

      matchesByTeams: {
        eyebrow: 'Consulta',
        title: 'Partidos por equipos',
        description:
          'Consulta los partidos disputados entre dos equipos seleccionados.',
        homeTeam: 'Equipo local',
        awayTeam: 'Equipo visitante',
        selectHomeTeam:
          'Selecciona el equipo local',
        selectAwayTeam:
          'Selecciona el equipo visitante',
        search: 'Consultar partidos',
        loading: 'Cargando partidos...',
        loadingTeams: 'Cargando equipos...',
        date: 'Fecha',
        teams: 'Equipos',
        score: 'Marcador',
        stadium: 'Estadio',
        phase: 'Fase',
        attendance: 'Audiencia',
        emptyTitle:
          'No hay partidos entre estos equipos.',
        emptyDescription:
          'No se encontraron partidos registrados para los equipos seleccionados.',
        loadError:
          'No se pudieron cargar los partidos.',
        teamsLoadError:
          'No se pudieron cargar los equipos.',
      },

      matchesByDate: {
        eyebrow: 'Consulta',
        title: 'Partidos por fecha',
        description:
          'Consulta los partidos disputados en una fecha determinada y filtra opcionalmente por estadio.',
        dateLabel: 'Fecha',
        stadiumLabel: 'Estadio',
        allStadiums: 'Todos los estadios',
        search: 'Consultar partidos',
        loadingStadiums: 'Cargando estadios...',
        loading: 'Cargando partidos...',
        date: 'Fecha',
        teams: 'Equipos',
        score: 'Marcador',
        stadium: 'Estadio',
        phase: 'Fase',
        attendance: 'Audiencia',
        emptyTitle:
          'No hay partidos para esta consulta.',
        emptyDescription:
          'No se encontraron partidos registrados para la fecha y el estadio seleccionados.',
        loadError:
          'No se pudieron cargar los partidos.',
        stadiumsLoadError:
          'No se pudieron cargar los estadios.',
      },

      topCoaches: {
        eyebrow: 'Experiencia',
        title: 'Entrenadores de más experiencia',
        description:
          'Consulta los tres entrenadores con mayor experiencia de cada equipo.',
        teamLabel: 'Equipo',
        position: 'Posición',
        coach: 'Entrenador',
        number: 'Número',
        experience: 'Experiencia',
        year: 'año',
        years: 'años',
        loading: 'Cargando entrenadores...',
        emptyTitle:
          'No hay entrenadores para mostrar.',
        emptyDescription:
          'No se encontraron entrenadores registrados.',
        loadError:
          'No se pudieron cargar los entrenadores.',
      },

      stadiumAttendance: {
        eyebrow: 'Audiencia',
        title: 'Estadios con mayor audiencia',
        description:
          'Consulta los estadios ordenados según el porcentaje de ocupación registrado.',
        position: 'Posición',
        stadium: 'Estadio',
        capacity: 'Capacidad',
        gamesPlayed: 'Partidos jugados',
        totalAttendance: 'Audiencia total',
        percentage: 'Porcentaje de audiencia',
        loading: 'Cargando audiencia de los estadios...',
        emptyTitle:
          'No hay datos de audiencia.',
        emptyDescription:
          'No se encontraron datos de partidos para calcular la audiencia de los estadios.',
        loadError:
          'No se pudo cargar la audiencia de los estadios.',
      },

      allStarTeam: {
        eyebrow: 'Selección',
        title: 'Equipo Todos Estrellas',
        description:
          'Consulta el mejor jugador de cada posición: el de mayor promedio de bateo y, entre los lanzadores, el de menor ERA.',
        position: 'Posición',
        player: 'Jugador',
        team: 'Equipo',
        average: 'Promedio',
        pitcherStats: {
          title: 'Estadísticas del lanzador',
          era: 'Carreras limpias por cada 9 entradas. Menor es mejor.',
          whip: 'Hits y bases por bolas por entrada. Menor es mejor.',
          k_per_9: 'Ponches por cada 9 entradas. Mayor es mejor.',
          bb_per_9: 'Bases por bolas por cada 9 entradas. Menor es mejor.',
          fip: 'Rendimiento sin depender de la defensa, en la escala del ERA. Menor es mejor.',
          selectionNote:
            'El lanzador se elige por menor ERA; las demás estadísticas son informativas.',
          incomplete:
            'Faltan datos de este lanzador (se registró antes de estas estadísticas): complétalos en Peloteros.',
        },
        loading: 'Cargando equipo Todos Estrellas...',
        emptyTitle:
          'No hay jugadores para formar el equipo.',
        emptyDescription:
          'No se encontraron jugadores con estadísticas suficientes.',
        loadError:
          'No se pudo cargar el equipo Todos Estrellas.',
      },

      teamStatus: {
        eyebrow: 'Análisis',
        title: 'Estado de un equipo',
        description:
          'Consulta las victorias y derrotas de un equipo, desglosadas por fase y condición de local o visitante.',
        teamLabel: 'Equipo',
        selectTeam: 'Selecciona un equipo',
        search: 'Consultar estado',
        loadingTeams: 'Cargando equipos...',
        loading: 'Cargando estado del equipo...',
        phase: 'Fase',
        total: 'Total',
        away: 'Visitante',
        home: 'Local',
        wins: 'victorias',
        losses: 'derrotas',
        emptyTitle:
          'No hay datos para este equipo.',
        emptyDescription:
          'No se encontraron partidos registrados para el equipo seleccionado.',
        loadError:
          'No se pudo cargar el estado del equipo.',
        teamsLoadError:
          'No se pudieron cargar los equipos.',
      },

      standings: {
        eyebrow: 'Clasificación',
        title: 'Tabla de posiciones',
        description:
          'Consulta la clasificación actual de los equipos de la Serie Nacional de Béisbol.',
        position: 'Posición',
        team: 'Equipo',
        gamesPlayed: 'Partidos jugados',
        points: 'Puntos',
        loading: 'Cargando tabla de posiciones...',
        emptyTitle: 'No hay datos de clasificación.',
        emptyDescription:
          'La tabla de posiciones aparecerá cuando existan datos registrados.',
        loadError:
          'No se pudo cargar la tabla de posiciones.',
      },


      matches: {
        eyebrow: 'Competición',
        title: 'Partidos',
        description:
          'Consulta y administra los partidos de la Serie Nacional de Béisbol.',
        newMatch: 'Nuevo partido',
        viewOnly: 'Solo consulta',
        visitorTeam: 'Equipo visitante',
        homeTeam: 'Equipo local',
        selectVisitorTeam: 'Selecciona el equipo visitante',
        selectHomeTeam: 'Selecciona el equipo local',
        date: 'Fecha',
        stadium: 'Estadio',
        selectStadium: 'Selecciona un estadio',
        phase: 'Fase',
        selectPhase: 'Selecciona una fase',
        visitorScore: 'Carreras visitante',
        homeScore: 'Carreras local',
        audience: 'Audiencia',
        tiebreaker: 'Partido de desempate',
        tiebreakerHint:
          'Forma parte de una serie de desempate del corte de esta fase (3 partidos a ganar 2).',
        tiebreakerBadge: 'Desempate',
        notActive: 'no activo',
        activeTeamsHint_one: '{{count}} equipo activo en esta fase.',
        activeTeamsHint_other: '{{count}} equipos activos en esta fase.',
        teams: 'Equipos',
        score: 'Marcador',
        search: 'Buscar',
        clearFilters: 'Limpiar filtros',
        filters: {
          team1: 'Equipo visitante',
          team2: 'Equipo local',
          teamPlaceholder: 'Filtrar por equipo',
          stadium: 'Estadio',
          stadiumPlaceholder: 'Filtrar por estadio',
          phase: 'Fase',
          phasePlaceholder: 'Filtrar por fase',
        },
        noResults:
          'No encontramos partidos con esos filtros.',
        noResultsDescription:
          'Prueba con otro equipo, estadio o fase.',
        emptyTitle: 'No hay partidos registrados.',
        emptyDescription:
          'La información aparecerá aquí cuando existan partidos.',
        createTitle: 'Nuevo partido',
        editTitle: 'Editar partido',
        delete: 'Eliminar',
        deleteTitle: 'Eliminar partido',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer.',
        loadError:
          'No se pudieron cargar los partidos.',
        saveError:
          'No se pudo guardar el partido.',
        deleteError:
          'No se pudo eliminar el partido.',
        validation: {
          visitorTeamRequired:
            'Debes seleccionar el equipo visitante.',
          homeTeamRequired:
            'Debes seleccionar el equipo local.',
          teamsMustDiffer:
            'El equipo visitante y el equipo local deben ser diferentes.',
          dateRequired:
            'La fecha del partido es obligatoria.',
          stadiumRequired:
            'Debes seleccionar un estadio.',
          phaseRequired:
            'Debes seleccionar una fase.',
          visitorScoreInvalid:
            'Las carreras del equipo visitante deben ser un entero mayor o igual que cero.',
          homeScoreInvalid:
            'Las carreras del equipo local deben ser un entero mayor o igual que cero.',
          audienceInvalid:
            'La audiencia debe ser un entero mayor o igual que cero.',
          dateOutsidePhase:
            'La fecha debe estar dentro del período de la fase {{phase}} ({{start}} al {{end}}).',
          audienceExceedsCapacity:
            'La audiencia no puede superar la capacidad del estadio ({{capacity}}).',
          missingPreviousPhase:
            'No se pueden registrar partidos de {{phase}}: antes debe crearse la fase {{previous}}.',
          previousPhaseUndecided:
            'No se pueden registrar partidos de {{phase}}: todavía no se sabe qué equipos clasifican de {{previous}}.',
          previousCutTied:
            'No se pueden registrar partidos de {{phase}}: el corte de {{previous}} está empatado entre {{teams}} y se decide con series de desempate de 3 partidos a ganar 2.',
          teamNotActive_one:
            '{{teams}} no está activo en {{phase}}: no clasificó en la fase anterior.',
          teamNotActive_other:
            '{{teams}} no están activos en {{phase}}: no clasificaron en la fase anterior.',
          noTieToBreak:
            'No hay empate en el corte de {{phase}} que desempatar.',
          tiebreakAlreadyResolved:
            'El desempate del corte de {{phase}} ya está resuelto.',
          phaseWithoutCut:
            'La fase {{phase}} no tiene corte, así que no admite partidos de desempate.',
          tiebreakerTeamsNotContenders:
            'Solo pueden jugar el desempate los equipos empatados en el corte que no hayan perdido una serie: {{teams}}.',
          tiebreakerDraw:
            'Un partido de desempate no puede terminar empatado.',
        },
      },

      phases: {
        eyebrow: 'Competición',
        title: 'Fases',
        description:
          'Administra las fases de la Serie Nacional y sus períodos de competencia.',
        search: 'Buscar',
        newPhase: 'Nueva fase',
        viewOnly: 'Solo consulta',
        name: 'Nombre',
      clearFilters: 'Limpiar filtros',
      filters: {
        name: 'Nombre',
        namePlaceholder: 'Filtrar por nombre',
        date: 'Fecha',
      },
        startDate: 'Fecha de inicio',
        endDate: 'Fecha de fin',
        noResults: 'No encontramos fases con esa búsqueda.',
        noResultsDescription:
          'Prueba con otro nombre de fase.',
        emptyTitle: 'No hay fases registradas.',
        emptyDescription:
          'La información aparecerá aquí cuando existan fases.',
        createTitle: 'Nueva fase',
        editTitle: 'Editar fase',
        delete: 'Eliminar',
        deleteTitle: 'Eliminar fase',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar esta fase? Esta acción no se puede deshacer.',
        selectName: 'Selecciona una fase',
        legacyNameHint:
          'El nombre actual ({{name}}) no es una fase de la Serie; elige uno de la lista.',
        validation: {
          nameRequired: 'El nombre de la fase es obligatorio.',
          startDateRequired: 'La fecha de inicio es obligatoria.',
          endDateRequired: 'La fecha de fin es obligatoria.',
          endDateBeforeStart:
            'La fecha de fin no puede ser anterior a la fecha de inicio.',
          nameTaken: 'Ya existe la fase {{phase}}.',
          mustStartAfter:
            'La fase {{phase}} debe comenzar después de que termine {{previous}} ({{date}}).',
          mustEndBefore:
            'La fase {{phase}} debe terminar antes de que comience {{next}} ({{date}}).',
        },
      },

      qualification: {
        title: 'Equipos activos por fase',
        description:
          'Primera Ronda la juegan todos los equipos. A Segunda Ronda, Play Off y Final pasan los 8, 4 y 2 con más puntos (victorias) de la fase anterior; un empate en el corte se decide con series de 3 partidos a ganar 2.',
        allTeams: 'Todos los equipos',
        activeTeams_one: '{{count}} equipo activo',
        activeTeams_other: '{{count}} equipos activos',
        notCreated: 'Esta fase aún no está creada.',
        participants: 'La jugarán: {{teams}}.',
        team: 'Equipo',
        games: 'PJ',
        points: 'Pts',
        status: 'Estado',
        teamStatus: {
          qualified: 'Clasifica',
          tied: 'En desempate',
          out: 'Fuera',
        },
        blocked: {
          missingPreviousPhase:
            'Se habilita cuando exista la fase {{previous}}.',
          previousPhaseUndecided:
            'Se habilita cuando se sepa qué equipos clasifican de {{previous}}.',
          previousCutTied:
            'Se habilita cuando se resuelva el empate en el corte de {{previous}}.',
        },
        undecided_one:
          'Aún no hay partidos: el clasificado se conocerá al jugarse la fase.',
        undecided_other:
          'Aún no hay partidos: los {{count}} clasificados se conocerán al jugarse la fase.',
        tieOpen_one:
          'Empate en el corte: {{teams}} ({{points}}) se disputan {{count}} plaza en series de 3 partidos a ganar 2.',
        tieOpen_other:
          'Empate en el corte: {{teams}} ({{points}}) se disputan {{count}} plazas en series de 3 partidos a ganar 2.',
        tieResolved_one:
          'Empate en el corte resuelto con series de desempate: pasa {{teams}}.',
        tieResolved_other:
          'Empate en el corte resuelto con series de desempate: pasan {{teams}}.',
        pointsLabel_one: '{{count}} punto',
        pointsLabel_other: '{{count}} puntos',
        loadError: 'No se pudo cargar la clasificación por fases.',
      },

      coaches: {
        eyebrow: 'Competición',
        title: 'Entrenadores',
        description:
          'Consulta y administra los entrenadores de los equipos participantes.',
        newCoach: 'Nuevo entrenador',
        viewOnly: 'Solo consulta',
        name: 'Nombre',
        number: 'Número',
        team: 'Equipo',
        selectTeam: 'Selecciona un equipo',
        yearsOnTeam: 'Años en el equipo',
        yearsExperience: 'Años de experiencia',
        clearFilters: 'Limpiar filtros',
        filters: {
          name: 'Nombre',
          namePlaceholder: 'Filtrar por nombre',
          number: 'Número',
          numberPlaceholder: 'Filtrar por número',
          team: 'Equipo',
          teamPlaceholder: 'Filtrar por equipo',
          yearsOnTeam: 'Años en el equipo',
          yearsExperience: 'Años de experiencia',
          yearsPlaceholder: 'Cantidad de años',
        },
        search: 'Buscar',
        searchPlaceholder:
          'Buscar por nombre, número, equipo o experiencia...',
        noResults:
          'No encontramos entrenadores con esa búsqueda.',
        noResultsDescription:
          'Prueba con otro nombre, número, equipo o cantidad de años.',
        emptyTitle: 'No hay entrenadores registrados.',
        emptyDescription:
          'La información aparecerá aquí cuando existan entrenadores.',
        createTitle: 'Nuevo entrenador',
        editTitle: 'Editar entrenador',
        delete: 'Eliminar',
        deleteTitle: 'Eliminar entrenador',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar este entrenador? Esta acción no se puede deshacer.',
        loadError:
          'No se pudieron cargar los entrenadores.',
        saveError:
          'No se pudo guardar el entrenador.',
        deleteError:
          'No se pudo eliminar el entrenador.',
        validation: {
          nameRequired:
            'El nombre del entrenador es obligatorio.',
          numberInvalid:
            'El número debe ser un entero mayor que cero.',
          yearsOnTeamInvalid:
            'Los años en el equipo deben ser un entero mayor o igual que cero.',
          teamRequired:
            'Debes seleccionar un equipo.',
          yearsExperienceInvalid:
            'Los años de experiencia deben ser un entero mayor o igual que cero.',
        },
      },

      teams: {
        delete: 'Eliminar',
        deleteTitle: 'Eliminar equipo',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.',
        deleteError:
          'No se pudo eliminar el equipo.',
        cannotDelete:
          'Este equipo no se puede eliminar porque tiene peloteros o partidos relacionados.',
        edit: 'Editar',
        editTitle: 'Editar equipo',
        editDescription:
          'Actualiza la información del equipo seleccionado.',
        eyebrow: 'Competición',
        title: 'Equipos',
        description:
          'Consulta los equipos participantes de la Serie Nacional.',
        searchPlaceholder:
          'Buscar por nombre o provincia...',
        searchLabel: 'Buscar',
        loading: 'Cargando equipos...',
        empty: 'No hay equipos registrados.',
        noResults:
          'No encontramos equipos con esa búsqueda.',
        newTeam: 'Nuevo equipo',
        viewOnly: 'Solo consulta',
        teamCount: 'equipos',
        clearFilters: 'Limpiar filtros',
        filters: {
          name: 'Nombre',
          namePlaceholder: 'Filtrar por nombre',
          province: 'Provincia',
          provincePlaceholder: 'Filtrar por provincia',
          color: 'Color',
          colorPlaceholder: 'Filtrar por color',
          mascot: 'Mascota',
          mascotPlaceholder: 'Filtrar por mascota',
          participated: 'Campeonatos participados',
          won: 'Campeonatos ganados',
          numberPlaceholder: 'Cantidad',
        },
        error:
          'No se pudieron cargar los equipos.',
        retry: 'Reintentar',
        emptyDescription:
          'La información aparecerá aquí cuando existan equipos.',
        clearSearch: 'Limpiar búsqueda',
        noResultsDescription:
          'Prueba con otro nombre, provincia, mascota o color.',
        participated: 'Participados',
        won: 'Ganados',
        mascot: 'Mascota',

        form: {
          createError:
            'No se pudo guardar el equipo.',
          updateError:
            'No se pudo actualizar el equipo.',
          editTitle: 'Editar equipo',
          editDescription:
            'Actualiza la información del equipo seleccionado.',
          createTitle: 'Nuevo equipo',
          createDescription:
            'Completa la información del nuevo equipo.',
          name: 'Nombre',
          province: 'Provincia',
          championshipsParticipated:
            'Campeonatos participados',
          championshipsWon:
            'Campeonatos ganados',
          mascot: 'Mascota',
          color: 'Color',
          cancel: 'Cancelar',
          save: 'Guardar equipo',

          validation: {
            required:
              'Este campo es obligatorio.',
            nonNegativeInteger:
              'Introduce un número entero igual o mayor que 0.',
            wonExceedsParticipated:
              'Los campeonatos ganados no pueden ser mayores que los campeonatos participados.',
          },
        },
      },

      stadiums: {
    title: 'Estadios',
    description: 'Gestiona los estadios registrados en la competición.',
    search: 'Buscar',
    clearFilters: 'Limpiar filtros',
    filters: {
      name: 'Nombre',
      namePlaceholder: 'Filtrar por nombre',
      province: 'Provincia',
      provincePlaceholder: 'Filtrar por provincia',
      capacity: 'Capacidad',
      capacityPlaceholder: 'Filtrar por capacidad',
    },
    name: 'Nombre',
    capacity: 'Capacidad',
    province: 'Provincia',
    loadError: 'No se pudieron cargar los estadios.',
    emptyTitle: 'No hay estadios',
    emptyDescription: 'No hay estadios registrados.',
    emptySearch: 'No encontramos estadios con esa búsqueda.',
    newStadium: 'Nuevo estadio',
    createDescription: 'Registra un nuevo estadio.',
    edit: 'Editar',
    editTitle: 'Editar estadio',
    editDescription: 'Actualiza la información del estadio seleccionado.',
    delete: 'Eliminar',
    deleteTitle: 'Eliminar estadio',
    deleteDescription:
      '¿Estás seguro de que deseas eliminar este estadio? Esta acción no se puede deshacer.',
    saveError: 'No se pudo guardar el estadio.',
    deleteError: 'No se pudo eliminar el estadio.',
    form: {
      name: 'Nombre',
      capacity: 'Capacidad',
      province: 'Provincia',
      cancel: 'Cancelar',
      save: 'Guardar',
      validation: {
        required: 'Este campo es obligatorio.',
        positiveInteger:
          'Introduce un número entero mayor que 0.',
      },
    },
  },

  players: {
        title: 'Peloteros',
        search: 'Buscar',
        searchPlaceholder: 'Buscar por nombre, equipo, posición o número...',
        number: 'Número',
        name: 'Nombre',
        team: 'Equipo',
        position: 'Posición',
        clearFilters: 'Limpiar filtros',
        filters: {
          number: 'Número',
          numberPlaceholder: 'Filtrar por número',
          name: 'Nombre',
          namePlaceholder: 'Filtrar por nombre',
          team: 'Equipo',
          teamPlaceholder: 'Filtrar por equipo',
          position: 'Posición',
          positionPlaceholder: 'Filtrar por posición',
        },
        yearsOnTeam: 'Años en equipo',
        atBats: 'Veces al bate',
        inningsPitched: 'Entradas lanzadas',
        hits: 'Hits',
        runsAllowed: 'Carreras permitidas',
        battingAverage: 'Promedio',
        loadError: 'No se pudieron cargar los peloteros.',
        emptyTitle: 'No hay peloteros',
        emptyDescription: 'No hay peloteros registrados.',
        emptySearch: 'No encontramos peloteros con esa búsqueda.',
        newPlayer: 'Nuevo pelotero',
        edit: 'Editar',
        editTitle: 'Editar pelotero',
        editDescription:
          'Actualiza la información del pelotero seleccionado.',
        delete: 'Eliminar',
        deleteTitle: 'Eliminar pelotero',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar este pelotero? Esta acción no se puede deshacer.',
        deleteError:
          'No se pudo eliminar el pelotero.',
        form: {
          name: 'Nombre',
          number: 'Número',
          yearsOnTeam: 'Años en equipo',
          team: 'Equipo',
          selectTeam: 'Selecciona un equipo',
          position: 'Posición',
          selectPosition: 'Selecciona una posición',
          inningsPitched: 'Entradas lanzadas',
          inningsPitchedHint:
            'Notación de béisbol: el decimal son outs (90.2 = 90 ⅔).',
          runsAllowed: 'Carreras permitidas',
          runsAllowedHint: 'Cuentan como carreras limpias para el ERA.',
          hitsAllowed: 'Hits permitidos',
          walksAllowed: 'Bases por bolas',
          strikeouts: 'Ponches',
          homeRunsAllowed: 'Jonrones permitidos',
          hitBatsmen: 'Pelotazos (bateadores golpeados)',
          pitcherAverageNote:
            'El promedio del lanzador es su ERA (carreras permitidas × 9 / entradas lanzadas) y se calcula solo.',
          atBats: 'Veces al bate',
          hits: 'Hits',
          battingAverage: 'Promedio de bateo',
          cancel: 'Cancelar',
          save: 'Guardar',
          validation: {
            required: 'Este campo es obligatorio.',
            positiveInteger: 'Introduce un número entero mayor que 0.',
            nonNegativeInteger:
              'Introduce un número entero mayor o igual que 0.',
            nonNegativeNumber:
              'Introduce un número mayor o igual que 0.',
            average:
              'El promedio debe estar entre 0 y 1.',
            inningsNotation:
              'Usa la notación de béisbol: entradas completas y .0, .1 o .2 (90.2 = 90 ⅔).',
            homeRunsExceedHits:
              'Los jonrones permitidos no pueden superar los hits permitidos.',
          },
        },
      },

      users: {
        eyebrow: 'Administración',
        title: 'Usuarios',
        description:
          'Administra las cuentas y permisos de acceso al sistema.',
        loading: 'Cargando usuarios...',
        username: 'Usuario',
        email: 'Correo electrónico',
        password: 'Contraseña',
        newPassword: 'Nueva contraseña',
        role: 'Rol',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        search: 'Buscar',
        clearFilters: 'Limpiar filtros',
        noResults: 'No se encontraron usuarios',
        noResultsDescription:
          'Ningún usuario coincide con los filtros seleccionados.',
        filters: {
          username: 'Usuario',
          usernamePlaceholder: 'Buscar por usuario',
          email: 'Correo',
          emailPlaceholder: 'Buscar por correo',
          role: 'Rol',
          rolePlaceholder: 'Buscar por rol',
          status: 'Estado',
          allStatuses: 'Todos',
        },
        actions: 'Acciones',
        newUser: 'Nuevo usuario',
        createTitle: 'Nuevo usuario',
        editTitle: 'Editar usuario',
        deleteTitle: 'Eliminar usuario',
        deleteDescription:
          '¿Estás seguro de que deseas eliminar al usuario "{{username}}"? Esta acción no se puede deshacer.',
        emptyTitle: 'No hay usuarios',
        emptyDescription:
          'No existen cuentas de usuario registradas.',
        loadError:
          'No se pudieron cargar los usuarios.',
        createError:
          'No se pudo crear el usuario.',
        saveError:
          'No se pudo guardar el usuario.',
        deleteError:
          'No se pudo eliminar el usuario.',
        validation: {
          usernameRequired:
            'El nombre de usuario es obligatorio.',
          emailRequired:
            'El correo electrónico es obligatorio.',
          passwordRequired:
            'La contraseña es obligatoria.',
          passwordLength:
            'La contraseña debe tener al menos 6 caracteres.',
        },
      },


      login: {
        brandEyebrow: 'Serie Nacional de Béisbol',
        brandTitle: 'Sigue la Serie. Vive el béisbol.',
        brandDescription:
          'Consulta equipos, jugadores, partidos, estadísticas y resultados de la Serie Nacional desde un solo lugar.',
        brandFooter: 'Serie Nacional de Béisbol',
        kicker: 'Acceso al sistema',
        title: 'Bienvenido de nuevo',
        description:
          'Inicia sesión con tus credenciales para continuar.',
        username: 'Usuario',
        usernamePlaceholder: 'Escribe tu usuario',
        password: 'Contraseña',
        passwordPlaceholder: 'Escribe tu contraseña',
        showPassword: 'Mostrar contraseña',
        hidePassword: 'Ocultar contraseña',
        submit: 'Iniciar sesión',
        loading: 'Iniciando sesión...',
        error: 'No se pudo iniciar sesión.',
        securityNote: 'Conexión protegida y acceso controlado.',
        changeLanguage: 'Cambiar idioma',
      },

      dashboard: {
        eyebrow: 'Panel principal',
        greeting: 'Hola',
        description:
          'Una vista general de los datos de la Serie Nacional.',
        session: 'Sesión',

        stats: {
          teams: 'Equipos',
          players: 'Peloteros',
          matches: 'Partidos',
          stadiums: 'Estadios',

          teamsDescription:
            'participantes registrados',
          playersDescription:
            'peloteros registrados',
          matchesDescription:
            'registrados en el sistema',
          stadiumsDescription:
            'disponibles para la competición',
        },

      standings: {
          eyebrow: 'Clasificación',
          title: 'Tabla de posiciones',
          leader: 'Líder',
          games: 'partidos',
          points: 'pts',
          loading:
            'Cargando clasificación...',
          empty:
            'No hay datos de clasificación.',
        },

        recentMatches: {
          eyebrow: 'Resultados',
          title: 'Últimos partidos',
          loading: 'Cargando partidos...',
          empty:
            'No hay partidos registrados.',
          away: 'visitante',
          home: 'local',
          vs: 'vs',
          attendees: 'asistentes',
        },

        nextStep: {
          eyebrow: 'Próximo paso',
          title:
            'Toda la gestión de BNSM en un solo lugar.',
          description:
            'Desde aquí conectaremos equipos, peloteros, entrenadores, partidos, estadios, fases y los siete reportes definidos por el proyecto.',
        },

        error:
          'No se pudo cargar la información del Dashboard.',
      },
    },
  },

  en: {
    translation: {
      common: {
        language: 'Language',
        spanish: 'Spanish',
        english: 'English',

        roles: {
          administrator: 'Administrator',
          user: 'User',
        },
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        retry: 'Retry',
        unknownError: 'An unexpected error occurred.',
      },

      profile: {
        changePhoto: 'Change profile photo',
        removePhoto: 'Remove profile photo',
        invalidType:
          'Invalid format. Use JPG, PNG or WebP.',
        tooLarge:
          'The image exceeds the maximum size of 5 MB.',
        uploadError:
          'The photo could not be uploaded. Please try again.',
      },

      errors: {
        forbiddenTitle: 'Access denied',
        forbiddenDescription:
          'You do not have permission to access this section.',
        notFoundTitle: 'Page not found',
        notFoundDescription:
          'The page you are looking for does not exist or is no longer available.',
        backToDashboard: 'Back to dashboard',
      },

      navigation: {
        competition: 'Competition',
        reports: 'Reports',
        administration: 'Administration',
        dashboard: 'Dashboard',
        teams: 'Teams',
        players: 'Players',
        coaches: 'Coaches',
        matches: 'Matches',
        stadiums: 'Stadiums',
        phases: 'Phases',
        reportStandings: 'Standings',
        reportMatchesByTeams: 'Matches by teams',
        reportMatchesByDate: 'Matches by date',
        reportTopCoaches: 'Most experienced coaches',
        reportStadiumAttendance: 'Stadiums with highest attendance',
        reportTeamStatus: 'Team status',
        reportAllStar: 'All-Star team',
        users: 'Users',
        logout: 'Sign out',
      },

      header: {
        league: 'National Baseball Series',
        title: 'Information Portal',
      },

      users: {
        eyebrow: 'Administration',
        title: 'Users',
        description:
          'Manage user accounts and access permissions for the system.',
        loading: 'Loading users...',
        username: 'Username',
        email: 'Email',
        password: 'Password',
        newPassword: 'New password',
        role: 'Role',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        search: 'Search',
        clearFilters: 'Clear filters',
        noResults: 'No users found',
        noResultsDescription:
          'No user matches the selected filters.',
        filters: {
          username: 'Username',
          usernamePlaceholder: 'Search by username',
          email: 'Email',
          emailPlaceholder: 'Search by email',
          role: 'Role',
          rolePlaceholder: 'Search by role',
          status: 'Status',
          allStatuses: 'All',
        },
        actions: 'Actions',
        newUser: 'New user',
        createTitle: 'New user',
        editTitle: 'Edit user',
        deleteTitle: 'Delete user',
        deleteDescription:
          'Are you sure you want to delete user "{{username}}"? This action cannot be undone.',
        emptyTitle: 'No users',
        emptyDescription:
          'There are no registered user accounts.',
        loadError:
          'Users could not be loaded.',
        createError:
          'The user could not be created.',
        saveError:
          'The user could not be saved.',
        deleteError:
          'The user could not be deleted.',
        validation: {
          usernameRequired:
            'Username is required.',
          emailRequired:
            'Email is required.',
          passwordRequired:
            'Password is required.',
          passwordLength:
            'Password must be at least 6 characters long.',
        },
      },

      reportEmail: {
        button: 'Send by email',
        title: 'Send report by email',
        recipient: 'Email address',
        placeholder: 'example@email.com',
        required: 'Enter an email address.',
        invalid: 'Enter a valid email address.',
        error: 'The report could not be sent by email.',
        cancel: 'Cancel',
        send: 'Send',
        sending: 'Sending...',
        close: 'Close',
      },

      reportPdf: {
        download: 'Download PDF',
        generating: 'Generating PDF...',
        error: 'Could not generate the PDF.',
      },

      matchesByTeams: {
        eyebrow: 'Search',
        title: 'Matches by teams',
        description:
          'View the matches played between two selected teams.',
        homeTeam: 'Home team',
        awayTeam: 'Visiting team',
        selectHomeTeam:
          'Select the home team',
        selectAwayTeam:
          'Select the visiting team',
        search: 'Search matches',
        loading: 'Loading matches...',
        loadingTeams: 'Loading teams...',
        date: 'Date',
        teams: 'Teams',
        score: 'Score',
        stadium: 'Stadium',
        phase: 'Phase',
        attendance: 'Attendance',
        emptyTitle:
          'There are no matches between these teams.',
        emptyDescription:
          'No registered matches were found for the selected teams.',
        loadError:
          'The matches could not be loaded.',
        teamsLoadError:
          'The teams could not be loaded.',
      },

      matchesByDate: {
        eyebrow: 'Search',
        title: 'Matches by date',
        description:
          'View the matches played on a specific date and optionally filter by stadium.',
        dateLabel: 'Date',
        stadiumLabel: 'Stadium',
        allStadiums: 'All stadiums',
        search: 'Search matches',
        loadingStadiums: 'Loading stadiums...',
        loading: 'Loading matches...',
        date: 'Date',
        teams: 'Teams',
        score: 'Score',
        stadium: 'Stadium',
        phase: 'Phase',
        attendance: 'Attendance',
        emptyTitle:
          'There are no matches for this search.',
        emptyDescription:
          'No registered matches were found for the selected date and stadium.',
        loadError:
          'The matches could not be loaded.',
        stadiumsLoadError:
          'The stadiums could not be loaded.',
      },

      topCoaches: {
        eyebrow: 'Experience',
        title: 'Most experienced coaches',
        description:
          'View the three most experienced coaches for each team.',
        teamLabel: 'Team',
        position: 'Position',
        coach: 'Coach',
        number: 'Number',
        experience: 'Experience',
        year: 'year',
        years: 'years',
        loading: 'Loading coaches...',
        emptyTitle:
          'There are no coaches to display.',
        emptyDescription:
          'No registered coaches were found.',
        loadError:
          'The coaches could not be loaded.',
      },

      stadiumAttendance: {
        eyebrow: 'Attendance',
        title: 'Stadiums with highest attendance',
        description:
          'View stadiums ordered by their recorded attendance percentage.',
        position: 'Position',
        stadium: 'Stadium',
        capacity: 'Capacity',
        gamesPlayed: 'Games played',
        totalAttendance: 'Total attendance',
        percentage: 'Attendance percentage',
        loading: 'Loading stadium attendance...',
        emptyTitle:
          'There is no attendance data.',
        emptyDescription:
          'No match data was found to calculate stadium attendance.',
        loadError:
          'The stadium attendance could not be loaded.',
      },

      allStarTeam: {
        eyebrow: 'Selection',
        title: 'All-Star Team',
        description:
          'View the best player at each position: the highest batting average and, among pitchers, the lowest ERA.',
        position: 'Position',
        player: 'Player',
        team: 'Team',
        average: 'Average',
        pitcherStats: {
          title: 'Pitcher statistics',
          era: 'Earned runs per 9 innings. Lower is better.',
          whip: 'Walks plus hits per inning. Lower is better.',
          k_per_9: 'Strikeouts per 9 innings. Higher is better.',
          bb_per_9: 'Walks per 9 innings. Lower is better.',
          fip: 'Performance independent of defense, on the ERA scale. Lower is better.',
          selectionNote:
            'The pitcher is chosen by lowest ERA; the other statistics are informative.',
          incomplete:
            'This pitcher is missing data (recorded before these statistics): complete it in Players.',
        },
        loading: 'Loading All-Star Team...',
        emptyTitle:
          'There are no players to form the team.',
        emptyDescription:
          'No players with sufficient statistics were found.',
        loadError:
          'The All-Star Team could not be loaded.',
      },

      teamStatus: {
        eyebrow: 'Analysis',
        title: 'Team status',
        description:
          'View a team’s wins and losses by phase and by home or away status.',
        teamLabel: 'Team',
        selectTeam: 'Select a team',
        search: 'View team status',
        loadingTeams: 'Loading teams...',
        loading: 'Loading team status...',
        phase: 'Phase',
        total: 'Total',
        away: 'Away',
        home: 'Home',
        wins: 'wins',
        losses: 'losses',
        emptyTitle:
          'There is no data for this team.',
        emptyDescription:
          'No registered matches were found for the selected team.',
        loadError:
          'The team status could not be loaded.',
        teamsLoadError:
          'The teams could not be loaded.',
      },

      standings: {
        eyebrow: 'Standings',
        title: 'League table',
        description:
          'View the current standings of the teams in the National Baseball Series.',
        position: 'Position',
        team: 'Team',
        gamesPlayed: 'Games played',
        points: 'Points',
        loading: 'Loading league table...',
        emptyTitle: 'There is no standings data.',
        emptyDescription:
          'The standings will appear when registered data is available.',
        loadError:
          'The standings could not be loaded.',
      },


      matches: {
        eyebrow: 'Competition',
        title: 'Matches',
        description:
          'Browse and manage the matches of the National Baseball Series.',
        newMatch: 'New match',
        viewOnly: 'View only',
        visitorTeam: 'Visiting team',
        homeTeam: 'Home team',
        selectVisitorTeam: 'Select the visiting team',
        selectHomeTeam: 'Select the home team',
        date: 'Date',
        stadium: 'Stadium',
        selectStadium: 'Select a stadium',
        phase: 'Phase',
        selectPhase: 'Select a phase',
        visitorScore: 'Visitor runs',
        homeScore: 'Home runs',
        audience: 'Attendance',
        tiebreaker: 'Tiebreaker game',
        tiebreakerHint:
          'Part of a tiebreaker series for this phase cut (best of three).',
        tiebreakerBadge: 'Tiebreaker',
        notActive: 'not active',
        activeTeamsHint_one: '{{count}} active team in this phase.',
        activeTeamsHint_other: '{{count}} active teams in this phase.',
        teams: 'Teams',
        score: 'Score',
        search: 'Search',
        clearFilters: 'Clear filters',
        filters: {
          team1: 'Visiting team',
          team2: 'Home team',
          teamPlaceholder: 'Filter by team',
          stadium: 'Stadium',
          stadiumPlaceholder: 'Filter by stadium',
          phase: 'Phase',
          phasePlaceholder: 'Filter by phase',
        },
        noResults:
          'We could not find any matches with those filters.',
        noResultsDescription:
          'Try another team, stadium, or phase.',
        emptyTitle: 'There are no registered matches.',
        emptyDescription:
          'Information will appear here when matches exist.',
        createTitle: 'New match',
        editTitle: 'Edit match',
        delete: 'Delete',
        deleteTitle: 'Delete match',
        deleteDescription:
          'Are you sure you want to delete this match? This action cannot be undone.',
        loadError:
          'The matches could not be loaded.',
        saveError:
          'The match could not be saved.',
        deleteError:
          'The match could not be deleted.',
        validation: {
          visitorTeamRequired:
            'You must select the visiting team.',
          homeTeamRequired:
            'You must select the home team.',
          teamsMustDiffer:
            'The visiting team and home team must be different.',
          dateRequired:
            'The match date is required.',
          stadiumRequired:
            'You must select a stadium.',
          phaseRequired:
            'You must select a phase.',
          visitorScoreInvalid:
            'Visitor runs must be an integer greater than or equal to zero.',
          homeScoreInvalid:
            'Home runs must be an integer greater than or equal to zero.',
          audienceInvalid:
            'Attendance must be an integer greater than or equal to zero.',
          dateOutsidePhase:
            'The date must be within the {{phase}} phase period ({{start}} to {{end}}).',
          audienceExceedsCapacity:
            'Attendance cannot exceed the stadium capacity ({{capacity}}).',
          missingPreviousPhase:
            'Games of {{phase}} cannot be recorded: the {{previous}} phase must be created first.',
          previousPhaseUndecided:
            'Games of {{phase}} cannot be recorded: it is not known yet which teams qualify from {{previous}}.',
          previousCutTied:
            'Games of {{phase}} cannot be recorded: the {{previous}} cut is tied between {{teams}} and is decided by best-of-three tiebreaker series.',
          teamNotActive_one:
            '{{teams}} is not active in {{phase}}: it did not qualify in the previous phase.',
          teamNotActive_other:
            '{{teams}} are not active in {{phase}}: they did not qualify in the previous phase.',
          noTieToBreak:
            'There is no tie at the {{phase}} cut to break.',
          tiebreakAlreadyResolved:
            'The tiebreaker for the {{phase}} cut is already resolved.',
          phaseWithoutCut:
            'The {{phase}} phase has no cut, so it does not allow tiebreaker games.',
          tiebreakerTeamsNotContenders:
            'Only teams tied at the cut that have not lost a series can play the tiebreaker: {{teams}}.',
          tiebreakerDraw:
            'A tiebreaker game cannot end in a draw.',
        },
      },

      phases: {
        eyebrow: 'Competition',
        title: 'Phases',
        description:
          'Manage the phases of the National Series and their competition periods.',
        search: 'Search',
        newPhase: 'New phase',
        viewOnly: 'View only',
        name: 'Name',
      clearFilters: 'Clear filters',
      filters: {
        name: 'Name',
        namePlaceholder: 'Filter by name',
        date: 'Date',
      },
        startDate: 'Start date',
        endDate: 'End date',
        noResults: 'We could not find any phases matching your search.',
        noResultsDescription:
          'Try another phase name.',
        emptyTitle: 'There are no registered phases.',
        emptyDescription:
          'Information will appear here when phases exist.',
        createTitle: 'New phase',
        editTitle: 'Edit phase',
        delete: 'Delete',
        deleteTitle: 'Delete phase',
        deleteDescription:
          'Are you sure you want to delete this phase? This action cannot be undone.',
        selectName: 'Select a phase',
        legacyNameHint:
          'The current name ({{name}}) is not a Series phase; choose one from the list.',
        validation: {
          nameRequired: 'The phase name is required.',
          startDateRequired: 'The start date is required.',
          endDateRequired: 'The end date is required.',
          endDateBeforeStart:
            'The end date cannot be earlier than the start date.',
          nameTaken: 'The {{phase}} phase already exists.',
          mustStartAfter:
            'The {{phase}} phase must start after {{previous}} ends ({{date}}).',
          mustEndBefore:
            'The {{phase}} phase must end before {{next}} starts ({{date}}).',
        },
      },

      qualification: {
        title: 'Active teams by phase',
        description:
          'Every team plays the Primera Ronda. The 8, 4 and 2 teams with the most points (wins) in the previous phase move on to Segunda Ronda, Play Off and Final; a tie at the cut is decided by best-of-three series.',
        allTeams: 'All teams',
        activeTeams_one: '{{count}} active team',
        activeTeams_other: '{{count}} active teams',
        notCreated: 'This phase has not been created yet.',
        participants: 'It will be played by: {{teams}}.',
        team: 'Team',
        games: 'GP',
        points: 'Pts',
        status: 'Status',
        teamStatus: {
          qualified: 'Qualifies',
          tied: 'In tiebreaker',
          out: 'Out',
        },
        blocked: {
          missingPreviousPhase:
            'Available once the {{previous}} phase exists.',
          previousPhaseUndecided:
            'Available once it is known which teams qualify from {{previous}}.',
          previousCutTied:
            'Available once the tie at the {{previous}} cut is resolved.',
        },
        undecided_one:
          'No games yet: the qualified team will be known once the phase is played.',
        undecided_other:
          'No games yet: the {{count}} qualified teams will be known once the phase is played.',
        tieOpen_one:
          'Tie at the cut: {{teams}} ({{points}}) compete for {{count}} spot in best-of-three series.',
        tieOpen_other:
          'Tie at the cut: {{teams}} ({{points}}) compete for {{count}} spots in best-of-three series.',
        tieResolved_one:
          'Tie at the cut resolved by tiebreaker series: {{teams}} moves on.',
        tieResolved_other:
          'Tie at the cut resolved by tiebreaker series: {{teams}} move on.',
        pointsLabel_one: '{{count}} point',
        pointsLabel_other: '{{count}} points',
        loadError: 'The phase qualification could not be loaded.',
      },

      coaches: {
        eyebrow: 'Competition',
        title: 'Coaches',
        description:
          'Browse and manage the coaches of the participating teams.',
        newCoach: 'New coach',
        viewOnly: 'View only',
        name: 'Name',
        number: 'Number',
        team: 'Team',
        selectTeam: 'Select a team',
        yearsOnTeam: 'Years on team',
        yearsExperience: 'Years of experience',
        clearFilters: 'Clear filters',
        filters: {
          name: 'Name',
          namePlaceholder: 'Filter by name',
          number: 'Number',
          numberPlaceholder: 'Filter by number',
          team: 'Team',
          teamPlaceholder: 'Filter by team',
          yearsOnTeam: 'Years on team',
          yearsExperience: 'Years of experience',
          yearsPlaceholder: 'Number of years',
        },
        search: 'Search',
        searchPlaceholder:
          'Search by name, number, team, or experience...',
        noResults:
          'We could not find any coaches matching your search.',
        noResultsDescription:
          'Try another name, number, team, or number of years.',
        emptyTitle: 'There are no registered coaches.',
        emptyDescription:
          'Information will appear here when coaches exist.',
        createTitle: 'New coach',
        editTitle: 'Edit coach',
        delete: 'Delete',
        deleteTitle: 'Delete coach',
        deleteDescription:
          'Are you sure you want to delete this coach? This action cannot be undone.',
        loadError:
          'The coaches could not be loaded.',
        saveError:
          'The coach could not be saved.',
        deleteError:
          'The coach could not be deleted.',
        validation: {
          nameRequired:
            'The coach name is required.',
          numberInvalid:
            'The number must be an integer greater than zero.',
          yearsOnTeamInvalid:
            'Years on the team must be an integer greater than or equal to zero.',
          teamRequired:
            'You must select a team.',
          yearsExperienceInvalid:
            'Years of experience must be an integer greater than or equal to zero.',
        },
      },

      teams: {
        delete: 'Delete',
        deleteTitle: 'Delete team',
        deleteDescription:
        'Are you sure you want to delete this team? This action cannot be undone.',
        deleteError:
        'The team could not be deleted.',
        cannotDelete:
        'This team cannot be deleted because it has related players or matches.',
        edit: 'Edit',
        editTitle: 'Edit team',
        editDescription:
        'Update the information for the selected team.',
        eyebrow: 'Competition',
        title: 'Teams',
        description:
          'Browse the teams participating in the National Series.',
        searchPlaceholder:
          'Search by name or province...',
        searchLabel: 'Search',
        loading: 'Loading teams...',
        empty:
          'There are no registered teams.',
        noResults:
          'We could not find any teams matching your search.',
        newTeam: 'New team',
        viewOnly: 'View only',
        teamCount: 'teams',
        clearFilters: 'Clear filters',
        filters: {
          name: 'Name',
          namePlaceholder: 'Filter by name',
          province: 'Province',
          provincePlaceholder: 'Filter by province',
          color: 'Color',
          colorPlaceholder: 'Filter by color',
          mascot: 'Mascot',
          mascotPlaceholder: 'Filter by mascot',
          participated: 'Championships participated',
          won: 'Championships won',
          numberPlaceholder: 'Quantity',
        },
        error:
          'The teams could not be loaded.',
        retry: 'Retry',
        emptyDescription:
          'Information will appear here when teams exist.',
        clearSearch: 'Clear search',
        noResultsDescription:
          'Try another name, province, mascot, or color.',
        participated: 'Participated',
        won: 'Won',
        mascot: 'Mascot',

        form: {
          createError:
            'The team could not be saved.',
          updateError:
            'The team could not be updated.',
          editTitle: 'Edit team',
          editDescription:
            'Update the information for the selected team.',  
          createTitle: 'New team',
          createDescription:
            'Enter the information for the new team.',
          name: 'Name',
          province: 'Province',
          championshipsParticipated:
            'Championships participated',
          championshipsWon:
            'Championships won',
          mascot: 'Mascot',
          color: 'Color',
          cancel: 'Cancel',
          save: 'Save team',

          validation: {
            required:
              'This field is required.',
            nonNegativeInteger:
              'Enter a whole number greater than or equal to 0.',
            wonExceedsParticipated:
              'Championships won cannot be greater than championships participated.',
          },
        },
      },

      stadiums: {
    title: 'Stadiums',
    description: 'Manage the stadiums registered in the competition.',
    search: 'Search',
    clearFilters: 'Clear filters',
    filters: {
      name: 'Name',
      namePlaceholder: 'Filter by name',
      province: 'Province',
      provincePlaceholder: 'Filter by province',
      capacity: 'Capacity',
      capacityPlaceholder: 'Filter by capacity',
    },
    name: 'Name',
    capacity: 'Capacity',
    province: 'Province',
    loadError: 'The stadiums could not be loaded.',
    emptyTitle: 'No stadiums',
    emptyDescription: 'There are no registered stadiums.',
    emptySearch: 'We could not find any stadiums matching your search.',
    newStadium: 'New stadium',
    createDescription: 'Register a new stadium.',
    edit: 'Edit',
    editTitle: 'Edit stadium',
    editDescription: 'Update the information for the selected stadium.',
    delete: 'Delete',
    deleteTitle: 'Delete stadium',
    deleteDescription:
      'Are you sure you want to delete this stadium? This action cannot be undone.',
    saveError: 'The stadium could not be saved.',
    deleteError: 'The stadium could not be deleted.',
    form: {
      name: 'Name',
      capacity: 'Capacity',
      province: 'Province',
      cancel: 'Cancel',
      save: 'Save',
      validation: {
        required: 'This field is required.',
        positiveInteger:
          'Enter an integer greater than 0.',
      },
    },
  },

  players: {
        title: 'Players',
        search: 'Search',
        searchPlaceholder: 'Search by name, team, position, or number...',
        number: 'Number',
        name: 'Name',
        team: 'Team',
        position: 'Position',
        clearFilters: 'Clear filters',
        filters: {
          number: 'Number',
          numberPlaceholder: 'Filter by number',
          name: 'Name',
          namePlaceholder: 'Filter by name',
          team: 'Team',
          teamPlaceholder: 'Filter by team',
          position: 'Position',
          positionPlaceholder: 'Filter by position',
        },
        yearsOnTeam: 'Years on team',
        atBats: 'At bats',
        inningsPitched: 'Innings pitched',
        hits: 'Hits',
        runsAllowed: 'Runs allowed',
        battingAverage: 'Batting average',
        loadError: 'The players could not be loaded.',
        emptyTitle: 'No players',
        emptyDescription: 'There are no registered players.',
        emptySearch: 'We could not find any players matching your search.',
        newPlayer: 'New player',
        edit: 'Edit',
        editTitle: 'Edit player',
        editDescription:
          'Update the information for the selected player.',
        delete: 'Delete',
        deleteTitle: 'Delete player',
        deleteDescription:
          'Are you sure you want to delete this player? This action cannot be undone.',
        deleteError:
          'The player could not be deleted.',
        form: {
          name: 'Name',
          number: 'Number',
          yearsOnTeam: 'Years on team',
          team: 'Team',
          selectTeam: 'Select a team',
          position: 'Position',
          selectPosition: 'Select a position',
          inningsPitched: 'Innings pitched',
          inningsPitchedHint:
            'Baseball notation: the decimal counts outs (90.2 = 90 ⅔).',
          runsAllowed: 'Runs allowed',
          runsAllowedHint: 'They count as earned runs for ERA.',
          hitsAllowed: 'Hits allowed',
          walksAllowed: 'Walks',
          strikeouts: 'Strikeouts',
          homeRunsAllowed: 'Home runs allowed',
          hitBatsmen: 'Hit batsmen',
          pitcherAverageNote:
            "A pitcher's average is their ERA (runs allowed × 9 / innings pitched), calculated automatically.",
          atBats: 'At bats',
          hits: 'Hits',
          battingAverage: 'Batting average',
          cancel: 'Cancel',
          save: 'Save',
          validation: {
            required: 'This field is required.',
            positiveInteger:
              'Enter an integer greater than 0.',
            nonNegativeInteger:
              'Enter an integer greater than or equal to 0.',
            nonNegativeNumber:
              'Enter a number greater than or equal to 0.',
            average:
              'The batting average must be between 0 and 1.',
            inningsNotation:
              'Use baseball notation: whole innings plus .0, .1 or .2 (90.2 = 90 ⅔).',
            homeRunsExceedHits:
              'Home runs allowed cannot exceed hits allowed.',
          },
        },
      },

      login: {
        brandEyebrow: 'National Baseball Series',
        brandTitle: 'Follow the Series. Live the game.',
        brandDescription:
          'Explore teams, players, matches, statistics and results from the National Baseball Series in one place.',
        brandFooter: 'National Baseball Series',
        kicker: 'System access',
        title: 'Welcome back',
        description:
          'Sign in with your credentials to continue.',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        submit: 'Sign in',
        loading: 'Signing in...',
        error: 'Unable to sign in.',
        securityNote: 'Protected connection and controlled access.',
        changeLanguage: 'Change language',
      },

      dashboard: {
        eyebrow: 'Main panel',
        greeting: 'Hello',
        description:
          'An overview of the National Series data.',
        session: 'Session',

        stats: {
          teams: 'Teams',
          players: 'Players',
          matches: 'Matches',
          stadiums: 'Stadiums',

          teamsDescription:
            'registered participants',
          playersDescription:
            'registered players',
          matchesDescription:
            'registered in the system',
          stadiumsDescription:
            'available for the competition',
        },

        standings: {
          eyebrow: 'Standings',
          title: 'League table',
          leader: 'Leader',
          games: 'games',
          points: 'pts',
          loading:
            'Loading standings...',
          empty:
            'There is no standings data.',
        },

        recentMatches: {
          eyebrow: 'Results',
          title: 'Latest matches',
          loading: 'Loading matches...',
          empty:
            'There are no registered matches.',
          away: 'away',
          home: 'home',
          vs: 'vs',
          attendees: 'attendees',
        },

        nextStep: {
          eyebrow: 'Next step',
          title:
            'All BNSM management in one place.',
          description:
            'From here we will connect teams, players, coaches, matches, stadiums, phases and the seven reports defined by the project.',
        },

        error:
          'The Dashboard information could not be loaded.',
      },
    },
  },
} as const;