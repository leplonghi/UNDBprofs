import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Course, Classroom, Student } from '@/types';
import type { User } from 'firebase/auth';

interface UseDashboardStatsResult {
    classroomsCount: number | null;
    studentsCount: number | null;
    classroomsByCourse: Record<string, Classroom[]>;
    isLoadingStats: boolean;
}

export function useDashboardStats(user: User | null | undefined, courses: Course[] | null): UseDashboardStatsResult {
    const firestore = useFirestore();
    const [stats, setStats] = useState<Omit<UseDashboardStatsResult, 'isLoadingStats'>>({
        classroomsCount: null,
        studentsCount: null,
        classroomsByCourse: {},
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const lastCoursesRef = useRef<string>('');

    useEffect(() => {
        async function fetchStats() {
            if (!user || !firestore) return;

            // If courses are loading, we can't fetch stats yet
            if (courses === undefined) return;

            // If no courses, reset stats
            if (!courses) {
                setStats({
                    classroomsCount: 0,
                    studentsCount: 0,
                    classroomsByCourse: {},
                });
                setIsLoadingStats(false);
                return;
            }

            // Generate a simple key to avoid re-fetching if courses haven't intrinsically changed
            const coursesKey = courses.map(c => c.id).sort().join(',');
            if (coursesKey === lastCoursesRef.current) {
                return; // Already fetched for these courses
            }
            lastCoursesRef.current = coursesKey;

            setIsLoadingStats(true);

            try {
                // 1. Parallel Fetch of All Classrooms
                const classroomPromises = courses.map(course =>
                    getDocs(collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms`))
                        .then(snapshot => ({
                            courseId: course.id,
                            classrooms: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom))
                        }))
                );

                const classroomsResults = await Promise.all(classroomPromises);

                const classroomsByCourseData: Record<string, Classroom[]> = {};
                const allClassrooms: { courseId: string; classroom: Classroom }[] = [];
                let totalClassrooms = 0;

                for (const result of classroomsResults) {
                    classroomsByCourseData[result.courseId] = result.classrooms;
                    totalClassrooms += result.classrooms.length;
                    result.classrooms.forEach(c => allClassrooms.push({ courseId: result.courseId, classroom: c }));
                }

                // 2. Parallel Fetch of Students (Batched if possible, but for now simple parallel)
                // Note: If scale is huge, we should chunk this, but for <50 classrooms it's fine in parallel
                const studentPromises = allClassrooms.map(({ courseId, classroom }) =>
                    getDocs(collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroom.id}/classroomStudents`))
                        .then(snapshot => snapshot.size)
                );

                const studentCounts = await Promise.all(studentPromises);
                const totalStudents = studentCounts.reduce((acc, count) => acc + count, 0);

                setStats({
                    classroomsCount: totalClassrooms,
                    studentsCount: totalStudents,
                    classroomsByCourse: classroomsByCourseData,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                // Keep partial data or set to 0? Ideally show error state, but for now just 0
                setStats(prev => ({ ...prev, classroomsCount: prev.classroomsCount ?? 0, studentsCount: prev.studentsCount ?? 0 }));
            } finally {
                setIsLoadingStats(false);
            }
        }

        fetchStats();
    }, [user, firestore, courses]);

    return { ...stats, isLoadingStats };
}
