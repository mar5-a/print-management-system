import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-100 px-6">
      <div className="ui-panel max-w-xl px-8 py-10">
        <div className="ui-kicker">404</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-950">
          The requested admin page was not found.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This build covers the main admin pages from the reference sidebar. Cards, help, and
          enable-printing remain intentionally out of scope.
        </p>
        <Link to="/admin/users" className="ui-button mt-6">
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </div>
    </div>
  )
}
