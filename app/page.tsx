"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";
import { formatDate, isInPast } from "./utils/utils";
import { LessonAttendence } from "./types";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [lessons, setLessons] = useState<LessonAttendence[]>([])

  const fetchAttendance = async () => {
    const { data } = await supabase.from('attendance').select('*').eq('email', email)
    if (!data?.length) {
      setError("Pro tento email nemáme žádné rezervace");
    } else {
      setShow(true);
      setError("")
      setLessons(data);
    }
  }

  const signIn = () => {
    fetchAttendance();
  }

  const signOut = () => {
    setShow(false)
    setEmail("")
    setLessons([])
  }

  const changeAttendance = async (id: number, will_attend: boolean) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    const isUnsigning = will_attend;

    const { error } = await supabase
      .from('attendance')
      .update({ will_attend: !will_attend })
      .eq('id', id);

    if (error) return;

    if (isUnsigning) {
      await handleUnsigning(lesson);
    } else {
      await handleResigning(lesson, id);
    }
  };

  const handleUnsigning = async (attendance: LessonAttendence) => {
    const timeZone = 'Europe/Prague';
    const schedule = getAttendanceSchedule(attendance.date);
    
    // Find the latest active attendance with same course + weekday + time
    const latestActiveMatch = findLatestActiveMatch(attendance, schedule);
    
    // Calculate new date: 7 days after the latest active match (or current attendance if no match)
    const baseDate = latestActiveMatch ? latestActiveMatch.date : attendance.date;
    const nextWeek = dayjs(baseDate).tz(timeZone).add(7, 'days');
    
    const newAttendance = {
      course_name: attendance.course_name,
      date: nextWeek,
      email: email,
      will_attend: true,
      did_not_showed_up: false
    };

    const { data: insertedAttendance, error } = await supabase
      .from('attendance')
      .insert(newAttendance)
      .select()
      .single();

    if (!error && insertedAttendance) {
      setLessons(prev => [
        ...prev.map(l => l.id === attendance.id ? { ...l, will_attend: false } : l),
        insertedAttendance
      ]);
    }
  };

  const findLatestActiveMatch = (
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

  const handleResigning = async (attendance: LessonAttendence, id: number) => {
    const latestUnsignedMatch = findLatestUnsignedMatch(attendance);

    if (latestUnsignedMatch) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', latestUnsignedMatch.id);

      if (!error) {
        setLessons(prev =>
          prev
            .map(l => l.id === id ? { ...l, will_attend: true } : l)
            .filter(l => l.id !== latestUnsignedMatch.id)
        );
      }
    } else {
      setLessons(prev =>
        prev.map(l => l.id === id ? { ...l, will_attend: true } : l)
      );
    }
  };

  const findLatestUnsignedMatch = (attendance: LessonAttendence): LessonAttendence | undefined => {
    const targetSchedule = getAttendanceSchedule(attendance.date);

    return lessons
      .filter(l => {
        if (l.course_name !== attendance.course_name || l.will_attend) return false;

        const schedule = getAttendanceSchedule(l.date);
        return schedule.dayOfWeek === targetSchedule.dayOfWeek && 
               schedule.timeInMinutes === targetSchedule.timeInMinutes;
      })
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())[0];
  };

  const getAttendanceSchedule = (dateString: string) => {
    const date = dayjs(dateString);
    return {
      dayOfWeek: date.day(),
      timeInMinutes: date.hour() * 60 + date.minute()
    };
  };

  function isAttendanceButtonActive(lessonDateInput: string | Date): boolean {
    const lessonDate = new Date(lessonDateInput);
    const now = new Date();

    const lessonYmd = lessonDate.toISOString().slice(0, 10);
    const todayYmd = now.toISOString().slice(0, 10);

    // Lekce v minulosti → skrýt
    if (lessonYmd < todayYmd) return true;

    // Lekce v budoucnu → zobrazit
    if (lessonYmd > todayYmd) return false;

    // Lekce dnes → limit 09:15
    const cutoff = new Date(now);
    cutoff.setHours(9, 15, 0, 0);

    return lessonDate.getTime() > cutoff.getTime(); // po 09:15 skrýt, jinak zobrazit
  }

  const getLessonState = (lesson: LessonAttendence) => {
    if (lesson.did_not_showed_up) {
      return <span className="font-bold">Neomluveno ❌</span>
    } else if (lesson.will_attend && isInPast(lesson.date)) {
      return <span className="text-gray-600 italic">Proběhla</span>
    } else if (lesson.will_attend) {
      return <span className="font-bold">Přihlášen ✅</span>
    } else {
      return "Nepřihlášen"
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex w-full flex-col items-center justify-center md:p-16 p-4 bg-white dark:bg-black">
        {!show ? <div className="flex flex-col gap-2 w-full max-w-sm pb-6">
          <label className="text-sm font-medium">Email objednávky</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !show) {
                event.preventDefault();
                signIn()
              }
            }}
            placeholder="Vaše emailová adresa"
            className="border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error ? <span className="text-red-600 pl-2">{error}</span> : undefined}
          <button
            onClick={() => signIn()}
            className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer"
          >
            Potvrdit
          </button>
        </div> : undefined}
        {show ? <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center pb-4">
            <div>
              <h2 className="font-extrabold">Přihlášen/a jako {email}</h2>
              <h3 className="italic text-gray-700">Počet zbývajících lekcí: {lessons.filter(l => !isInPast(l.date)).length}</h3>
            </div>
            <div>
              <button
                onClick={() => signOut()}
                className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-32">
                Odhlásit
              </button>
            </div>
          </div>
          {!lessons.length ? <>Je nám líto, ale pro tento email zřejmě neevidujeme žádné rezervace...</> : undefined}
          <div className="flex flex-col gap-2 w-full max-w-4xl overflow-scroll h-96 pt-3">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-center">
                  <th className="py-2">Datum</th>
                  <th className="py-2">Lekce</th>
                  <th className="py-2">Stav</th>
                  <th className="py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((lesson) => (
                  <tr key={lesson.id} className="border-b text-center">
                    <td className="py-2 font-bold">{formatDate(lesson.date)}</td>
                    <td className="py-2">{lesson.course_name}</td>
                    <td className="py-2">{getLessonState(lesson)}</td>
                    <td className="py-2">
                      {isAttendanceButtonActive(lesson.date) ? undefined : <button
                        onClick={() => { changeAttendance(lesson.id, lesson.will_attend) }}
                        className="rounded-xl border px-3 py-1 cursor-pointer">
                        {lesson.will_attend ? "Odhlásit" : "Přihlásit"}
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> : undefined}
      </main>
    </div>
  );
}