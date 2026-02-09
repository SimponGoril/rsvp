"use client"
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { isInPast, isToday } from "../utils/utils";
import { LessonAttendence } from "../types";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Calendar } from "../components/ui/calendar";
import { validateAdminCredentials } from "../utils/validateAdmin";
import { changeAttendanceAdmin, deleteAttendance, fetchAttendance, insertAttendance, updateAttendence } from "../lib/actions";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home() {
    const [loginError, setLoginError] = useState("");
    const [email, setEmail] = useState("admin");
    const [password, setPassword] = useState("admin");
    const [show, setShow] = useState(false);
    const [lessons, setLessons] = useState<LessonAttendence[]>([])
    const [notification, setNotification] = useState("");
    const [newCourseName, setNewCourseName] = useState("Kurz kresby a malby pro děti");
    const [newEmail, setNewEmail] = useState("");
    const [newDate, setNewDate] = useState("");
    const [numberOfLessonsAdded, setNumberOfLessonsAdded] = useState(2);
    const [newSigned, setNewSigned] = useState(true);
    const [addAfter, setAddAfter] = useState(true);
    const [date, setDate] = useState<Date | undefined>(new Date())

    const handleAddLesson = async () => {
        if (!newDate) return;

        const lessons = await insertAttendance(newDate, newCourseName, newEmail, numberOfLessonsAdded, newSigned, addAfter) as LessonAttendence[];

        if (lessons) {
            setNotification("Lekce byly úspěšně přidány");
            setTimeout(() => setNotification(""), 3000);
            setLessons(lessons);
            // Reset form fields
            setNewDate("");
            setNewEmail("");
            setNewCourseName("Kurzy pro děti");
            setNewSigned(true);
            setNumberOfLessonsAdded(2);
        }
    };

    const signIn = async () => {
        if (await validateAdminCredentials(email, password)) {
            setLessons(await fetchAttendance() || []);
            setShow(true);
        } else {
            setLoginError("Neplatné přihlašovací údaje");
        }
    }

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

    const displayWeekdayTimes = () => {
        const weekdayMap: Record<string, number> = { 'pondělí': 1, 'úterý': 2, 'středa': 3, 'čtvrtek': 4, 'pátek': 5 };
        const timeStrings = [
            'pondělí 12:00', 'pondělí 15:00', 'pondělí 17:00',
            'úterý 14:00', 'úterý 16:00', 'úterý 18:00',
            'středa 13:30', 'středa 15:30', 'středa 18:00',
            'čtvrtek 13:30', 'čtvrtek 15:30', 'čtvrtek 18:00',
            'pátek 14:30'
        ];

        const times = timeStrings.map(t => {
            const [weekday, time] = t.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            const targetDayOfWeek = weekdayMap[weekday];

            // Find the closest future occurrence of this weekday/time starting from tomorrow
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDayOfWeek = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();

            // Calculate days from tomorrow until target
            const daysFromTomorrow = (targetDayOfWeek - tomorrowDayOfWeek + 7) % 7;

            const closestDate = new Date(tomorrow);
            closestDate.setDate(closestDate.getDate() + daysFromTomorrow);
            closestDate.setHours(hours, minutes, 0, 0);

            return { display: t, datetime: closestDate.toISOString() };
        });

        return <div className="grid grid-cols-3 gap-4">
            {times.map((t, i) => {
                const dateObj = new Date(t.datetime);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                const fullDateTime = `${day}.${month}.${year} ${hours}:${minutes}`;

                return <label key={t.display} className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="datetime"
                        value={t.datetime}
                        checked={newDate === t.datetime}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="mt-1"
                    />
                    <div className="flex flex-col">
                        <span className="font-medium underline">{t.display}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{fullDateTime}</span>
                    </div>
                </label>;
            })}
        </div>
    }

    const LessonTables = (selectedDate?: Date) => {
        function formatLessonHeading(input: string) {
            const match = input.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/);
            if (!match) return null;

            const dateString = match[1];
            const courseName = input.replace(dateString, '').replace(/[-\s]+$/, '');
            const d = dayjs.utc(dateString).tz('Europe/Prague');
            const weekday = d.toDate().toLocaleDateString('cs-CZ', { weekday: 'long' });
            const hours = d.format('HH');
            const minutes = d.format('mm');

            return `${courseName} ${weekday} - ${hours}:${minutes}`;
        }

        const data = Object.entries(getLessonsForDate(selectedDate)).sort().reverse();

        return (
            <Accordion type="multiple" className="w-full">
                {data.map(([key, participants]) => (
                    <AccordionItem key={key} value={key}>
                        <AccordionTrigger>
                            <div className="font-semibold text-base">
                                {formatLessonHeading(key)} ({participants.filter(p => p.will_attend).length}) {isToday(key) ? <span className="ml-2 italic text-blue-600 dark:text-blue-400 text-sm font-normal">(dnes)</span> : undefined}
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
                                                <td className="px-1 py-3 text-center">{p.did_not_showed_up ? 'Neomluvena 🚫' : p.will_attend ? 'Přihlášena ✅' : 'Nepřihlášena ❌'}</td>
                                                <td className="px-1 py-3 text-center flex gap-1 justify-center">
                                                    {!isInPast(p.date) ? (
                                                        <button
                                                            onClick={async () => setLessons(await updateAttendence(p.id, !p.will_attend, p.will_attend))}
                                                            className="rounded-lg border border-gray-300 dark:border-gray-600 px-1 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                                                            {p.will_attend ? 'Odhlásit' : 'Přihlásit'}
                                                        </button>
                                                    ) : p.will_attend ? (
                                                        <button
                                                            onClick={async () => setLessons(await updateAttendence(p.id, p.will_attend, !p.did_not_showed_up))}
                                                            className="rounded-lg border border-red-300 dark:border-red-600 px-1 py-1.5 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
                                                            {!p.did_not_showed_up ? 'Neomluveno' : 'Omluveno'}
                                                        </button>
                                                    ) : undefined}
                                                    <button
                                                        onClick={async () => setLessons(await deleteAttendance(p.id))}
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
                    {loginError ? <span className="text-red-600 pl-2">{loginError}</span> : undefined}
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
                            <AccordionTrigger>Přidat účast na lekcích</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-4 w-full pt-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <label className="text-sm font-bold">Název lekce</label>
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
                                    </div>
                                    <label className="text-sm font-bold">Den a čas prvního kurzu</label>
                                    {displayWeekdayTimes()}
                                    <label className="text-sm font-bold">Počet přidávaných kurzů</label>
                                    <input
                                        type="number"
                                        value={numberOfLessonsAdded}
                                        onChange={(e) => setNumberOfLessonsAdded(Number(e.target.value))}
                                        className="border rounded-xl p-2"
                                    />
                                    {/* <input
                                        type="datetime-local"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="border rounded-xl p-2"
                                    /> */}
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
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={addAfter}
                                            onChange={(e) => setAddAfter(e.target.checked)}
                                        />
                                        Přidat za poslední aktivní lekci
                                    </label>
                                    <div className="flex flex-col">
                                        <button
                                            onClick={handleAddLesson}
                                            className="mt-2 rounded-xl border px-4 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer w-40"
                                        >
                                            Přidat lekci
                                        </button>
                                        {notification ? <span className="text-green-600 pl-2">{notification}</span> : undefined}
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
