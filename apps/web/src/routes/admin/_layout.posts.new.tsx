import { createFileRoute } from '@tanstack/react-router';
import { PostEditor } from './-components/PostEditor';

export const Route = createFileRoute('/admin/_layout/posts/new')({
  component: NewPostPage,
});

function NewPostPage() {
  return <PostEditor />;
}
