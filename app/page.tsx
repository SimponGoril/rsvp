"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";
import { formatDate } from "./utils/utils";
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
    const { error } = await supabase
      .from('attendance')
      .update({ 'will_attend': !will_attend })
      .eq('id', id);

      if (!error) {
        setLessons(prev =>
          prev.map(l =>
            l.id === id ? { ...l, will_attend: !will_attend } : l
          )
        );
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
            <h2 className="font-extrabold">Přihlášen/a jako {email}</h2>
            <button
              onClick={() => signOut()}
              className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-32">
              Odhlásit
            </button>
          </div>
          {!lessons.length ? <>Je nám líto, ale pro tento email zřejmě neevidujeme žádné rezervace...</> : undefined}
          <div className="flex flex-col gap-2 w-full max-w-4xl overflow-scroll h-96 pt-3">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Datum</th>
                  <th className="py-2 text-left">Lekce</th>
                  <th className="py-2 text-left">Stav</th>
                  <th className="py-2 text-left">Akce</th>
                </tr>
              </thead>
              <tbody>
                {lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((lesson) => (
                  <tr key={lesson.id} className="border-b">
                    <td className="py-2 font-bold">{formatDate(lesson.date)}</td>
                    <td className="py-2">{lesson.course_name}</td>
                    <td className="py-2">{lesson.will_attend ? "Přihlášen ✅" : "Nepřihlášen ❌"}</td>
                    <td className="py-2">
                        <button
                          onClick={() => {changeAttendence(lesson.id, lesson.will_attend)}}
                          className="rounded-xl border px-3 py-1 cursor-pointer">
                          {lesson.will_attend ? "Odhlásit" : "Přihlásit"}
                        </button>
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
