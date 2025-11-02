"use client"

import Image from "next/image";

import supabase from './utils/supabase'
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const defaultLessons = [
    {
        id: 1,
        name: "Lekce jógy – začátečníci",
        date: "2025-02-16 17:00",
        email: "john.doe@seznam.cz",
        isSigned: true
    },
    {
        id: 5,
        name: "Lekce jógy – začátečníci",
        date: "2025-02-19 18:00",
        email: "carl.smith@seznam.cz",
        isSigned: true
    },
    {
        id: 4,
        name: "Lekce jógy – začátečníci",
        date: "2025-02-19 18:00",
        email: "karel.smith@seznam.cz",
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
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [lessons, setLessons] = useState(defaultLessons)
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newSigned, setNewSigned] = useState(true);

    const handleAddLesson = () => {
        const newLesson = {
            id: lessons.length + 1,
            name: newName,
            date: newDate,
            email: newEmail,
            isSigned: newSigned
        };
        setLessons([...lessons, newLesson]);
    };

    const handleRemoveLesson = (id) => {
        setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
    };

    // const fetchTodos = async () => {
    //   const { data } = await supabase.from('orders').select('*')
    //   console.log(data)
    // }
    // fetchTodos() 

    return (
        <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
            <main className="flex w-full flex-col items-center justify-center md:p-16 p-4 bg-white dark:bg-black">
                {!show ? <div className="flex flex-col gap-2 w-full max-w-sm pb-6">
                    <label className="text-sm font-medium">Vstup do Administrace docházky</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Uživatelské jméno"
                        className="border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Heslo"
                        className="border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => { setShow(true) }}
                        className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer"
                    >
                        Potvrdit
                    </button>
                </div> : undefined}
                {show ? <div className="w-full max-w-3/4 flex justify-center align-center flex-col">
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="bg-zinc-100 p-2">Přidat jednu lekci</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance bg-zinc-100 p-2">
                                <div className="flex flex-col gap-2 w-full pt-4 pb-6 border-b">
                                    <label className="text-sm font-medium">Název lekce</label>
                                    <select
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="border rounded-xl p-2"
                                    >
                                        <option value="">Vyberte lekci</option>
                                        <option value="Kurzy pro děti">Kurzy pro děti</option>
                                        <option value="Výtvarný workshop">Výtvarný workshop</option>
                                    </select>
                                    <label className="text-sm font-medium">Datum a čas</label>
                                    <input
                                        type="datetime-local"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="border rounded-xl p-2"
                                    />
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="border rounded-xl p-2"
                                    />
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={newSigned}
                                            onChange={(e) => setNewSigned(e.target.checked)}
                                        />
                                        Přihlášen
                                    </label>

                                    <div className="flex justify-between">
                                        <button
                                            onClick={handleAddLesson}
                                            className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-40"
                                        >
                                            Přidat lekci
                                        </button>
                                        <button
                                            //onClick={handleAddLesson}
                                            className="mt-2 rounded-xl border px-4 py-2 font-medium bg-black text-white hover:cursor-pointer w-40"
                                        >
                                            Uložit
                                        </button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <div className="flex flex-col gap-2 w-full pt-3">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 text-left">Datum</th>
                                    <th className="py-2 text-left">Lekce</th>
                                    <th className="py-2 text-left">Email</th>
                                    <th className="py-2 text-left">Stav</th>
                                    <th className="py-2 text-left">Akce</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lessons.sort((a, b) => new Date(a.date) - new Date(b.date)).map((lesson) => (
                                    <tr key={lesson.id} className="border-b">
                                        <td className="py-2 font-bold">{lesson.date}</td>
                                        <td className="py-2">{lesson.name}</td>
                                        <td className="py-2">{lesson.email}</td>
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
                                            <button
                                                onClick={() => handleRemoveLesson(lesson.id)}
                                                className="rounded-xl border ml-2 px-3 py-1 text-red-600 cursor-pointer"
                                            >
                                                X
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
