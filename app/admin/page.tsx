"use client"
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import supabase from "../utils/supabase";
import { isInPast, isToday } from "../utils/utils";
import { LessonAttendence } from "../types";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Calendar } from "../components/ui/calendar";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [lessons, setLessons] = useState<LessonAttendence[]>([])
    const [newCourseName, setNewCourseName] = useState("Kurzy pro děti");
    const [newEmail, setNewEmail] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newSigned, setNewSigned] = useState(true);
    const [date, setDate] = useState<Date | undefined>(new Date())

    // const peopleMap = lessons.reduce<Record<string, LessonAttendence[]>>((acc, lesson) => {
    //     const key = lesson.email ?? "unknown";
    //     if (!acc[key]) acc[key] = [];
    //     acc[key].push(lesson);
    //     return acc;
    // }, {});

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

    // Get lessons for the selected date (based on the calendar input).
    const getLessonsForDate = (dateArg?: Date) => {
        const timeZone = 'Europe/Prague';
        const target = dayjs.tz(dateArg ?? new Date(), timeZone).format('YYYY-MM-DD');

        const result: Record<string, LessonAttendence[]> = {};

        for (const lesson of lessons) {
            const d = dayjs.tz(String(lesson.date), timeZone);
            if (d.format('YYYY-MM-DD') !== target) continue;

            const fullDate = d.format('YYYY-MM-DDTHH:mm');
            const lessonKey = `${lesson.course_name}-${fullDate}`;

            if (!result[lessonKey]) result[lessonKey] = [];
            result[lessonKey].push(lesson);
        }

        return result;
    };

    const LessonTables = (selectedDate?: Date) => {
        function formatLessonHeading(input: string) {
            const match = input.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/);
            if (!match) return null;

            const dateString = match[1];
            const courseName = input.replace(dateString, '').replace(/[-\s]+$/, '');

            const d = new Date(dateString);
            const weekday = d.toLocaleDateString('cs-CZ', { weekday: 'long' });
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');

            return `${courseName} ${weekday} ${hours}:${minutes}`;
        }

        const data = getLessonsForDate(selectedDate);

        return (
            <Accordion type="multiple" className="w-full">
                {Object.entries(data).sort().reverse().map(([key, participants]) => (
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger>
                            <div className="font-semibold text-base">
                                {formatLessonHeading(key)} {isToday(key) ? <span className="ml-2 italic text-blue-600 dark:text-blue-400 text-sm font-normal">(dnes)</span> : undefined}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            {/* Show a single table of attendees for this course session (selected day) */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="px-1 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                            <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Účast</th>
                                            <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Akce</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.map((p) => (
                                            <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-1 py-3 text-gray-800 dark:text-gray-200">{p.email ?? 'unknown'}</td>
                                                <td className="px-1 py-3 text-center">{p.did_not_showed_up ? 'Neomluvena 💔' : p.will_attend ? 'Přihlášena ✅' : 'Nepřihlášena ❌'}</td>
                                                <td className="px-1 py-3 text-center flex gap-1 justify-center">
                                                    {!isInPast(p.date) ? (
                                                        <button
                                                            onClick={() => { handleChangeAttendence(p.id, p.will_attend) }}
                                                            className="rounded-lg border border-gray-300 dark:border-gray-600 px-1 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                                                            {p.will_attend ? 'Odhlásit' : 'Přihlásit'}
                                                        </button>
                                                    ) : p.will_attend ? (
                                                        <button
                                                            onClick={() => handleDidNotShowUp(p.id, p.did_not_showed_up || false)}
                                                            className="rounded-lg border border-red-300 dark:border-red-600 px-1 py-1.5 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
                                                            {!p.did_not_showed_up ? 'Neomluveno' : 'Omluveno'}
                                                        </button>
                                                    ) : undefined}
                                                    <button
                                                        onClick={() => handleDeleteAttendance(p.id)}
                                                        className="rounded-lg border border-red-300 dark:border-red-600 px-1 py-1.5 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
                                                        Smazat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    // Dates which have at least one lesson (used to highlight days on the calendar)
    const highlightedDates = Array.from(new Set(lessons.map(l => dayjs.tz(String(l.date), 'Europe/Prague').format('YYYY-MM-DD'))))
        .map(s => {
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
        });

    return (
        <div className="flex min-h-screen items-start justify-center bg-white font-sans dark:bg-black">
            <main className="flex w-full flex-col items-center justify-center md:p-16 p-4 bg-white dark:bg-black">
                {!show ? <div className="flex flex-col gap-2 w-full max-w-sm pb-6 pt-60 items-center">
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
                {show ? <div className="w-full lg:max-w-3/4 flex justify-center align-center flex-col">
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Přidat jednu lekci</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 w-full pt-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <label className="text-sm font-medium">Název lekce</label>
                                    <div className="flex flex-col gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="lesson"
                                                value="Kurz kresby a malby pro děti"
                                                checked={newCourseName === "Kurz kresby a malby pro děti"}
                                                onChange={(e) => setNewCourseName(e.target.value)}
                                            />
                                            Kurz kresby a malby pro děti
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="lesson"
                                                value="Příprava na talentové zkoušky"
                                                checked={newCourseName === "Příprava na talentové zkoušky"}
                                                onChange={(e) => setNewCourseName(e.target.value)}
                                            />
                                            Příprava na talentové zkoušky
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="lesson"
                                                value="Intenzivní kurz kresby a malby pro mládež"
                                                checked={newCourseName === "Intenzivní kurz kresby a malby pro mládež"}
                                                onChange={(e) => setNewCourseName(e.target.value)}
                                            />
                                            Intenzivní kurz kresby a malby pro mládež
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
                    <div className="flex p-2 justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            highlightedDates={highlightedDates}
                            className="rounded-md border shadow-sm"
                            captionLayout="dropdown"
                        />
                    </div>
                    <div className="w-full flex justify-center mt-2">
                        <h2 className="text-lg font-semibold text-center">
                            {date
                                ? new Date(date).toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Nevybrali jste žádné datum'}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-2 w-full pt-3">
                        {LessonTables(date)}
                    </div>
                </div> : undefined
                }
            </main >
        </div >
    );
}
