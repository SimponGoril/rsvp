"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);

  // const fetchTodos = async () => {
  //   const { data } = await supabase.from('orders').select('*')
  //   console.log(data)
  // }
  // fetchTodos() 
  const lessons = [
    {
      id: 1,
      name: "Lekce jógy – začátečníci",
      date: "2025-02-14 18:00",
      isSigned: true
    },
    {
      id: 2,
      name: "Pilates – středně pokročilí",
      date: "2025-02-16 17:00",
      isSigned: false
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    },
    {
      id: 3,
      name: "Kruhový trénink",
      date: "2025-02-18 19:30",
      isSigned: true
    }
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
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
          <button
            onClick={() => { setShow(false) }}
            className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-32"
          >
            Zpět
          </button>
          <div className="flex flex-col gap-2 w-full max-w-4xl overflow-scroll h-96 pt-3">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Lekce</th>
                  <th className="py-2 text-left">Datum</th>
                  <th className="py-2 text-left">Stav</th>
                  <th className="py-2 text-left">Akce</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b">
                    <td className="py-2">{lesson.name}</td>
                    <td className="py-2">{lesson.date}</td>
                    <td className="py-2">{lesson.isSigned ? "Přihlášen" : "Nepřihlášen"}</td>
                    <td className="py-2">
                      {lesson.isSigned ? (
                        <button
                          onClick={() => {}}
                          className="rounded-xl border px-3 py-1"
                        >
                          Odhlásit
                        </button>
                      ) : (
                        <button
                          onClick={() => {}}
                          className="rounded-xl border px-3 py-1"
                        >
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
