import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/symptoms')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/symptoms"!</div>
}
