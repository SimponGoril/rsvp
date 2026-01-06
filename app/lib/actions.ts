'use server'
import dayjs from "dayjs";
import { LessonAttendence } from "../types"
import supabase from "../utils/supabase"
import { findLatestActiveMatch, findLatestUnsignedMatch, getAttendanceSchedule } from "../utils/utils";

export async function fetchAttendance(email?: string): Promise<LessonAttendence[]> {
    'use server'
    if (email) {
        const { data } = await supabase.from('attendance').select('*').eq('email', email)
        return data as LessonAttendence[];
    } else {
        const { data } = await supabase.from('attendance').select('*')
        return data as LessonAttendence[];
    }
}

export async function deleteAttendance(id: number) {
    'use server'
    await supabase
        .from('attendance')
        .delete()
        .eq('id', id)
    const { data } = await supabase.from('attendance').select('*')
    return data as LessonAttendence[];
}

export async function insertAttendance(newDate: string, newCourseName: string, newEmail: string, numberOfLessonsAdded: number, newSigned: boolean, addAfter: boolean): Promise<LessonAttendence[] | undefined> {
    'use server'
    const lessonsToAdd = [];

    let startDate = dayjs(newDate);

    if (addAfter) {
        const { data: existingLessons } = await supabase
            .from('attendance')
            .select('*')
            .eq('email', newEmail);

        const latestActiveLesson = existingLessons
            ?.filter(l => l.course_name === newCourseName && l.will_attend)
            .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())[0];

        if (latestActiveLesson) {
            const latestDate = dayjs(latestActiveLesson.date);
            startDate = latestDate.add(7, 'days');
        }
    }

    // Generate multiple lessons starting from newDate, each one week apart
    for (let i = 0; i < numberOfLessonsAdded; i++) {
        const lessonDate = startDate.add(i * 7, 'days');
        lessonsToAdd.push({
            course_name: newCourseName,
            date: lessonDate.toDate().toISOString(),
            email: newEmail,
            will_attend: newSigned,
            did_not_showed_up: false
        });
    }

    await supabase
        .from('attendance')
        .insert(lessonsToAdd)
    const { data } = await supabase.from('attendance').select('*')
    return data as LessonAttendence[];
}

export async function updateAttendence(id: number, will_attend: boolean, did_not_showed_up: boolean): Promise<LessonAttendence[]> {
    'use server'
    await supabase
        .from('attendance')
        .update({ 'will_attend': will_attend, 'did_not_showed_up': did_not_showed_up })
        .eq('id', id);
    const { data } = await supabase.from('attendance').select('*')
    return data as LessonAttendence[];
}

export async function changeAttendance(id: number, email: string, will_attend: boolean): Promise<LessonAttendence[]> {
    'use server'
    const { data: lessons } = await supabase
        .from('attendance')
        .select('*')
        .eq('email', email);

    const { data: lesson } = await supabase
        .from('attendance')
        .select('*')
        .eq('id', id)
        .single();

    const isUnsigning = will_attend;

    await supabase
        .from('attendance')
        .update({ will_attend: !will_attend })
        .eq('id', id);

    if (isUnsigning) {
        return await handleUnsigning(lesson, lessons as LessonAttendence[], false);
    } else {
        return await handleResigning(lesson, lessons as LessonAttendence[], id, false);
    }
};

export async function changeAttendanceAdmin(id: number, email: string, will_attend: boolean): Promise<LessonAttendence[]> {
    'use server'
    const { data: lessons } = await supabase
        .from('attendance')
        .select('*')
        .eq('email', email);

    const { data: lesson } = await supabase
        .from('attendance')
        .select('*')
        .eq('id', id)
        .single();

    const isUnsigning = will_attend;

    await supabase
        .from('attendance')
        .update({ will_attend: !will_attend })
        .eq('id', id);

    if (isUnsigning) {
        return await handleUnsigning(lesson, lessons as LessonAttendence[], true);
    } else {
        return await handleResigning(lesson, lessons as LessonAttendence[], id, true);
    }
};

async function handleResigning(attendance: LessonAttendence, lessons: LessonAttendence[], id: number, isAdmin: boolean): Promise<LessonAttendence[]> {
    'use server'
    const latestUnsignedMatch = findLatestUnsignedMatch(lessons, attendance);

    if (latestUnsignedMatch) {
        await supabase
            .from('attendance')
            .delete()
            .eq('id', latestUnsignedMatch.id);
    }

    if (isAdmin) {
        const updatedLessons = await supabase.from('attendance')
            .select('*')
        return updatedLessons.data || [];
    } else {
        const updatedLessons = await supabase.from('attendance')
            .select('*')
            .eq('email', attendance.email);
        return updatedLessons.data || [];
    }
};

const handleUnsigning = async (attendance: LessonAttendence, lessons: LessonAttendence[], isAdmin: boolean): Promise<LessonAttendence[]> => {
    const schedule = getAttendanceSchedule(attendance.date);

    // Find the latest active attendance with same course + weekday + time
    const latestActiveMatch = findLatestActiveMatch(lessons, attendance, schedule);

    // Calculate new date: 7 days after the latest active match (or current attendance if no match)
    const baseDate = latestActiveMatch ? latestActiveMatch.date : attendance.date;
    const nextWeek = dayjs(baseDate).add(7, 'days');

    const newAttendance = {
        course_name: attendance.course_name,
        date: nextWeek,
        email: attendance.email,
        will_attend: true,
        did_not_showed_up: false
    };

    const { data: insertedAttendance, error } = await supabase
        .from('attendance')
        .insert(newAttendance)
        .select()
        .single();


    if (isAdmin) {
        const updatedLessons = await supabase.from('attendance')
            .select('*')
        return updatedLessons.data || [];
    } else {
        const updatedLessons = await supabase.from('attendance')
            .select('*')
            .eq('email', attendance.email);
        return updatedLessons.data || [];
    }
};