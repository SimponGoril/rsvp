"use client"

import Image from "next/image";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import supabase from "../utils/supabase";
import { formatDate } from "../utils/utils";
import { LessonAttendence } from "../types";

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [lessons, setLessons] = useState<LessonAttendence[]>([])
    const [newCourseName, setNewCourseName] = useState("Kurzy pro děti");
    const [newEmail, setNewEmail] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newSigned, setNewSigned] = useState(true);

    const handleAddLesson = async () => {
        const newLesson = {
            course_name: newCourseName,
            date: newDate,
            email: newEmail,
            will_attend: newSigned
        };

        const { data, error } = await supabase
            .from('attendance')
            .insert(newLesson)
            .select()

        if (!error) {
            setLessons([...lessons, data[0]]);
        }
    };

    const handleDeleteAttendance = async (id: number) => {
        const { error } = await supabase
            .from('attendance')
            .delete()
            .eq('id', id)

        if (!error) {
            setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
        }
    }

    const fetchAttendance = async () => {
        const { data } = await supabase.from('attendance').select('*')
        if (!data?.length) {
        } else {
            setShow(true);
            setLessons(data);
        }
    }

    const handleChangeAttendence = async (id: number, will_attend: boolean) => {
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

    const signIn = () => {
        fetchAttendance();
    }

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
                        onClick={() => { signIn() }}
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
                                    <div className="flex flex-row gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="lesson"
                                                value="Kurzy pro děti"
                                                checked={newCourseName === "Kurzy pro děti"}
                                                onChange={(e) => setNewCourseName(e.target.value)}
                                            />
                                            Kurzy pro děti
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="lesson"
                                                value="Výtvarný workshop"
                                                checked={newCourseName === "Výtvarný workshop"}
                                                onChange={(e) => setNewCourseName(e.target.value)}
                                            />
                                            Výtvarný workshop
                                        </label>
                                    </div>
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
                                {lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((lesson) => (
                                    <tr key={lesson.id} className="border-b">
                                        <td className="py-2 font-bold">{formatDate(lesson.date)}</td>
                                        <td className="py-2">{lesson.course_name}</td>
                                        <td className="py-2">{lesson.email}</td>
                                        <td className="py-2">{lesson.will_attend ? "Přihlášen ✅" : "Nepřihlášen ❌"}</td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => { handleChangeAttendence(lesson.id, lesson.will_attend) }}
                                                className="rounded-xl border px-3 py-1 cursor-pointer">
                                                {lesson.will_attend ? "Odhlásit" : "Přihlásit"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAttendance(lesson.id)}
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
