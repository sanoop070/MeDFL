import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/diseases/$disease')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/diseases/$disease"!</div>
}
