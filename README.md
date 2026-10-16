# BaseballNacionalSeriesManager

(3 estudiantes)
Proyecto #9: Serie Nacional de Béisbol.

El Instituto Nacional de Deporte, Educación Física y Recreación (INDER) tiene la
necesidad de disponer de un sistema que le permita el control de todos los datos
asociados a la Serie Nacional de Béisbol con el objetivo de que la misma se
realice de forma más eficiente. En la Serie se enfrentan un conjunto de equipos de
los que se sabe, por cada uno: el nombre, la provincia que representan, la
cantidad de campeonatos en la que ha participado, la cantidad de campeonatos
ganados, la mascota y el color.
Cada equipo está compuesto por un grupo de peloteros, de los que se conoce
nombre, número y cantidad de años en el equipo. Además los peloteros pueden
ser divididos en dos categorías: los entrenadores, encargados de la dirección y los
entrenamientos del equipo, y los jugadores que son los que salen al campo de
pelota a jugar determinado partido. A parte de la información mencionada
anteriormente referente a los peloteros, se conoce además de los entrenadores la
cantidad de años de experiencia y de los jugadores la posición en la que juegan, la
cantidad de veces al bate o entradas lanzadas (en dependencia de si la posición
del jugador es lanzador o no), la cantidad de hits conectados o de carreras
permitidas (en dependencia de si la posición del jugador es lanzador o no) y el
promedio.
De cada partido a jugar en la Serie es necesario registrar los equipos
protagonistas (equipo visitante y equipo home club), la fecha de realización, el
estadio, la fase a la que pertenece (Primera Ronda, Segunda Ronda, Play Off y
Final) el resultado y la cantidad de audiencia que tuvo una vez que se haya
finalizado el juego. Es importante precisar que también se conoce de los estadios
en los que se efectuarán los partidos el nombre, la capacidad y la provincia a la
que pertenece, y de las fases el nombre, la fecha de comienzo y terminación de
las mismas.
Al termino de cada partido, el equipo ganador sumará un punto, estrategia que
permitirá en todo momento saber la tabla de posiciones en que se encuentran los
equipos participantes. Una vez terminada determinada fase solo quedarán activos
en la Serie el conjunto de equipos que posean la mayor cantidad de puntos. La
cantidad de equipos que se quedarán activos en las fases Segunda Ronda, Play
Off y Final serán 8, 4 y 2 respectivamente.
Además de todo lo mencionado anteriormente, el sistema a desarrollar deberá ser
capaz de generar el siguiente conjunto de reportes:

1. Tabla de posiciones de la serie: se mostrará el listado de los equipos
participantes en la Serie ordenados de acuerdo a la cantidad de puntos
obtenidos. El reporte deberá incluir el nombre y la cantidad de puntos por
cada equipo.

2. Partidos por equipos: se mostrará dado dos equipos, la información de los
partidos que cumplan con esos parámetros.

3. Partidos jugados por fecha: se mostrará dado una fecha y un estadio, la
información del partido realizado que cumpla con esos parámetros. En caso
de que el estadio no sea pasado por parámetros, se mostrará entonces la
información correspondiente a todos los partidos efectuados en esa fecha.

4. Entrenadores de más experiencia: se mostrará un listado por cada equipo
conformado por los 3 entrenadores de mayor experiencia. El reporte deberá
incluir el nombre, el número y los años de experiencias del entrenador,
estar agrupado por el nombre de los equipos y ordenado
descendentemente por la cantidad de campeonatos ganados por los
mismos.

5. Estadios con mayor audiencia: se mostrará el listado de los estadios
ordenados a partir de su porciento de audiencia, es decir la audiencia total
que ha tenido el estadio / la audiencia total que pudo haber tenido * 100.

6. Estado de un equipo: se mostrará dado un equipo, la cantidad de juegos
que ganó y perdió (la cantidad total, la cantidad como visitante y la cantidad
como home club). El reporte deberá mostrar la información mencionada
agrupada por las fases de la Serie.

7. Equipo todos estrellas: se mostrará el listado de jugadores (cada uno
perteneciente a una posición distinta) que conformarán el equipo todos
estrellas de la Serie. Cada jugador se seleccionará por poseer mejor
promedio con respecto a los otros jugadores de esa posición. El reporte
deberá incluir la posición, el nombre del jugador, el nombre de equipo al
que pertenece y el promedio de mismo.

 El sistema debe verificar que cuando se vaya a registrar la fecha de un
partido, que la misma esté comprendida en el rango de fechas establecido
por la fase a la que pertenece el partido.
