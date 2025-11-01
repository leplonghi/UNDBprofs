import { CourseDetailClient } from '@/components/courses/course-detail-client';

// This is now a Server Component
export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // We can safely access params.id here on the server
  const { id } = params;

  // We pass the resolved id string as a prop to the Client Component
  return <CourseDetailClient courseId={id} />;
}
