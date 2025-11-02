"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";

const defaultLessons = [
  {
    id: 1,
    name: "Lekce jógy – začátečníci",
    date: "2025-02-14 18:00",
    email: "john.doe@seznam.cz",
    isSigned: true
  },
  {
    id: 2,
    name: "Pilates – středně pokročilí",
    date: "2025-02-16 17:00",
    email: "john.doe@seznam.cz",
    isSigned: false
  },
  {
    id: 3,
    name: "Kruhový trénink",
    date: "2025-02-18 19:30",
    email: "john.doe@seznam.cz",
    isSigned: true
  }
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [lessons, setLessons] = useState(defaultLessons)

  // const fetchTodos = async () => {
  //   const { data } = await supabase.from('orders').select('*')
  //   console.log(data)
  // }
  // fetchTodos() 

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex w-full flex-col items-center justify-center md:p-16 p-4 bg-white dark:bg-black">
        {!show ? <div className="flex flex-col gap-2 w-full max-w-sm pb-6">
          <label className="text-sm font-medium">Email objednávky</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Vaše emailová adresa"
            className="border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setShow(true) }}
            className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer"
          >
            Potvrdit
          </button>
        </div> : undefined}
        {show ? <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center pb-4">
            <h2 className="font-extrabold">Přihlášen/a jako {email}</h2><button
              onClick={() => { setShow(false) }}
              className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-32">
              Odhlásit
            </button>
          </div>
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
                {lessons.sort((a, b) => new Date(a.date) - new Date(b.date)).map((lesson) => (
                  <tr key={lesson.id} className="border-b">
                    <td className="py-2 font-bold">{lesson.date}</td>
                    <td className="py-2">{lesson.name}</td>
                    <td className="py-2">{lesson.isSigned ? "Přihlášen ✅" : "Nepřihlášen ❌"}</td>
                    <td className="py-2">
                      {lesson.isSigned ? (
                        <button
                          onClick={() => { }}
                          className="rounded-xl border px-3 py-1 cursor-pointer">
                          Odhlásit
                        </button>
                      ) : (
                        <button
                          onClick={() => { }}
                          className="rounded-xl border px-3 py-1 cursor-pointer">
                          Přihlásit
                        </button>
                      )}
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
