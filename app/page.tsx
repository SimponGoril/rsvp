"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";
import { formatDate, isInPast } from "./utils/utils";
import { LessonAttendence } from "./types";


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

  const changeAttendence = async (id: number, will_attend: boolean) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    const isUnsigning = will_attend; // if will_attend is true, they're currently signed in, so unsigning

    // Update the current lesson
    const { error } = await supabase
      .from('attendance')
      .update({ 'will_attend': !will_attend })
      .eq('id', id);

    if (error) return;

    // If unsigning, create a new lesson for the same day/time next week
    if (isUnsigning) {
      const currentDate = new Date(lesson.date);
      const nextWeekDate = new Date(currentDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);

      const newLesson = {
        course_name: lesson.course_name,
        date: nextWeekDate.toISOString(),
        email: email,
        will_attend: true,
        did_not_showed_up: false
      };

      const { data: insertedLesson, error: insertError } = await supabase
        .from('attendance')
        .insert(newLesson)
        .select()
        .single();

      if (!insertError && insertedLesson) {
        setLessons(prev =>
          prev
            .map(l => l.id === id ? { ...l, will_attend: !will_attend } : l)
            .concat(insertedLesson)
        );
      }
    } else {
      // If signing in to an older lesson, remove the last unsigned lesson with same course, weekday, and time
      const currentDate = new Date(lesson.date);
      const currentDayOfWeek = currentDate.getDay();
      const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();

      const matchingUnsignedLessons = lessons.filter(l => {
        if (l.course_name !== lesson.course_name || l.will_attend) return false;

        const lessonDate = new Date(l.date);
        const lessonDayOfWeek = lessonDate.getDay();
        const lessonTime = lessonDate.getHours() * 60 + lessonDate.getMinutes();

        return lessonDayOfWeek === currentDayOfWeek && lessonTime === currentTime;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastUnsignedLesson = matchingUnsignedLessons[0];

      if (lastUnsignedLesson) {
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('id', lastUnsignedLesson.id);

        if (!deleteError) {
          setLessons(prev =>
            prev
              .map(l => l.id === id ? { ...l, will_attend: !will_attend } : l)
              .filter(l => l.id !== lastUnsignedLesson.id)
          );
        }
      } else {
        // If no unsigned lesson to remove, just update the current lesson
        setLessons(prev =>
          prev.map(l =>
            l.id === id ? { ...l, will_attend: !will_attend } : l
          )
        );
      }
    }
  }

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
                        onClick={() => { changeAttendence(lesson.id, lesson.will_attend) }}
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
