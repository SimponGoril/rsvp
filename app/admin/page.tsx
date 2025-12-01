"use client"

import Image from "next/image";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import supabase from "../utils/supabase";
import { formatDate, isInPast, isToday } from "../utils/utils";
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
            will_attend: newSigned,
            did_not_showed_up: false
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

    const handleDidNotShowUp = async (id: number, did_not_showed_up: boolean) => {
        const { error } = await supabase
            .from('attendance')
            .update({ 'did_not_showed_up': !did_not_showed_up })
            .eq('id', id);

        if (!error) {
            setLessons(prev =>
                prev.map(l =>
                    l.id === id ? { ...l, did_not_showed_up: !did_not_showed_up } : l
                )
            );
        }
    }

    const signIn = () => {
        fetchAttendance();
    }

    const mapLessons = (
        lessons: LessonAttendence[]
    ): Record<string, LessonAttendence[]> => {
        const result: Record<string, LessonAttendence[]> = {};

        for (const lesson of lessons) {
            const d = new Date(lesson.date);
            const fullDate = d.toISOString().slice(0, 10); // YYYY-MM-DD
            const key = `${fullDate}`;

            if (!result[key]) {
                result[key] = [];
            }

            result[key].push(lesson);
        }
        return result;
    }

    const LessonTables = (data: Record<string, LessonAttendence[]>) => {
        return (
            <Accordion type="multiple" className="w-full" defaultValue={[Object.keys(data).find(k => isToday(k)) ?? ""]}>
                {Object.entries(data).sort().reverse().map(([key, participants]) => (
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger><div className="font-bold text-2xl cursor-pointer">{key} {isToday(key) ? <span className="italic text-gray-400">(dnes)</span> : undefined}</div></AccordionTrigger>
                        <AccordionContent>
                            <table className="border-collapse border border-gray-400 w-full">
                                <thead>
                                    <tr>
                                        <th className="border px-2 py-1">Čas</th>
                                        <th className="border px-2 py-1">Kurz</th>
                                        <th className="border px-2 py-1">Email</th>
                                        <th className="border px-2 py-1">Účast</th>
                                        <th className="border px-2 py-1">Akce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map((p) => (
                                        <tr key={p.id}>
                                            <td className="border px-2 py-1 text-center">{formatDate(p.date)}</td>
                                            <td className="border px-2 py-1 text-center">{p.course_name}</td>
                                            <td className="border px-2 py-1 text-center">{p.email}</td>
                                            <td className="border px-2 py-1 text-center">{p.did_not_showed_up ? "Neomluvena 💔" : p.will_attend ? "Přihlášena ✅" : "Nepřihlášena ❌"}</td>
                                            <td className="border px-2 py-1 text-center">
                                                {!isInPast(p.date) ? <button
                                                    onClick={() => { handleChangeAttendence(p.id, p.will_attend) }}
                                                    className="rounded-xl border px-3 py-1 cursor-pointer">
                                                    {p.will_attend ? "Odhlásit" : "Přihlásit"}
                                                </button> :
                                                    p.will_attend ? < button
                                                        onClick={() => handleDidNotShowUp(p.id, p.did_not_showed_up || false)}
                                                        className="rounded-xl border ml-2 px-3 py-1 text-red-600 cursor-pointer">
                                                        {!p.did_not_showed_up ? "Neomluveno" : "Omluveno"}
                                                    </button> : undefined

                                                }
                                                <button
                                                    onClick={() => handleDeleteAttendance(p.id)}
                                                    className="rounded-xl border ml-2 px-3 py-1 text-red-600 cursor-pointer">
                                                    Smazat
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

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
                                        {/* <button
                                            //onClick={handleAddLesson}
                                            className="mt-2 rounded-xl border px-4 py-2 font-medium bg-black text-white hover:cursor-pointer w-40"
                                        >
                                            Uložit
                                        </button> */}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <div className="flex flex-col gap-2 w-full pt-3">
                        {LessonTables(mapLessons(lessons))}
                    </div>
                </div> : undefined
                }
            </main >
        </div >
    );
}
