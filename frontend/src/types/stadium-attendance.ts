export interface StadiumAttendance {
  stadium_name: string;
  capacity: number;
  games_played: number;
  total_attendance: number;
  attendance_percentage: number | null;
}
