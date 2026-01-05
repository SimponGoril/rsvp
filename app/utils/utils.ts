import dayjs from "dayjs";
import { LessonAttendence } from "../types";

export const formatDate = (isoString: string) => {
  const d = new Date(isoString);

  const day = String(d.getDate()).padStart(2, '0');
  const weekday = d.toLocaleDateString('cs-CZ', { weekday: 'long' });
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}.${month} ${weekday} ${hours}:${minutes}`;
};

export const isInPast = (dateInput: string): boolean => {
  const d = new Date(dateInput);
  const now = new Date();
  return d.getTime() < now.getTime();
}

export const isToday = (dateInput: string | Date): boolean => {
  const d = new Date(dateInput);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
export const getAttendanceSchedule = (dateString: string) => {
  const date = dayjs(dateString);
  return {
    dayOfWeek: date.day(),
    timeInMinutes: date.hour() * 60 + date.minute()
  };
};
export const findLatestUnsignedMatch = (lessons: LessonAttendence[], attendance: LessonAttendence): LessonAttendence | undefined => {
  const targetSchedule = getAttendanceSchedule(attendance.date);

  return lessons
    .filter(l => {
      if (l.course_name !== attendance.course_name || !l.will_attend) return false;

      const schedule = getAttendanceSchedule(l.date);
      return schedule.dayOfWeek === targetSchedule.dayOfWeek &&
        schedule.timeInMinutes === targetSchedule.timeInMinutes;
    })
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())[0];
};


 export const findLatestActiveMatch = (
    lessons: LessonAttendence[],
    attendance: LessonAttendence,
    targetSchedule: { dayOfWeek: number; timeInMinutes: number }
  ): LessonAttendence | undefined => {
    const now = dayjs();
    
    return lessons
      .filter(l => {
        // Must match course name
        if (l.course_name !== attendance.course_name) return false;
        
        // Must be active (will_attend = true)
        if (!l.will_attend) return false;
        
        // Must be in the future
        if (dayjs(l.date).isBefore(now)) return false;
        
        // Must match weekday and time
        const schedule = getAttendanceSchedule(l.date);
        return schedule.dayOfWeek === targetSchedule.dayOfWeek && 
               schedule.timeInMinutes === targetSchedule.timeInMinutes;
      })
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())[0];
  };