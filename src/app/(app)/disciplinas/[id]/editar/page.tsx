import { EditCourseForm } from '@/components/courses/edit-course-form';

// This is a Server Component that handles fetching params on the server.
export default function EditCoursePage({ params }: { params: { id: string } }) {
  // We can safely access params.id here on the server as it's synchronous.
  const { id } = params;

  // We pass the resolved id string as a prop to the Client Component.
  return <EditCourseForm courseId={id} />;
}
