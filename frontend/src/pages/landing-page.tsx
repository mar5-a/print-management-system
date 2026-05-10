import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'

import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChartNoAxesCombined,
  FileCheck2,
  FileClock,
  FolderCheck,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Platform', href: '#platform' },
  { label: 'Features', href: '#features' },
  { label: 'Operations', href: '#operations' },
  { label: 'Security', href: '#security' },
  { label: 'Contact', href: '#contact' },
]

const proofItems = [
  'HP private/personal device-memory release',
  'Backend-generated PIN reveal',
  'Retryable store-on-device flow',
  'Connector and printer reachability checks',
  'File cleanup and expiry with preserved logs',
  'Role-based access for students, admins, technicians',
]

const features = [
  {
    title: 'Secure PIN release',
    description: 'Held until PIN entry at the printer panel.',
    icon: KeyRound,
  },
  {
    title: 'Quota-aware submission',
    description: 'PDF-only upload with backend-inferred page count.',
    icon: FileCheck2,
  },
  {
    title: 'Connector health checks',
    description: 'Preflight checks before storage attempts.',
    icon: Activity,
  },
  {
    title: 'Retry and recovery',
    description: 'Failed storage stays retryable until expiry.',
    icon: LifeBuoy,
  },
  {
    title: 'Admin monitoring',
    description: 'Users, printers, queues, quotas, logs.',
    icon: UserCog,
  },
  {
    title: 'Technician alerts',
    description: 'Alerts, status context, issue handling.',
    icon: AlertTriangle,
  },
  {
    title: 'Audit and print logs',
    description: 'Operational and print event history.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'File cleanup and expiry',
    description: 'Print files removed, metadata retained.',
    icon: FolderCheck,
  },
]

const workflow = [
  {
    title: 'Upload PDF',
    detail: 'Student submits PDF and copy count.',
  },
  {
    title: 'Held job',
    detail: 'Backend infers pages and applies quota.',
  },
  {
    title: 'Store on printer',
    detail: 'Connector stores into HP private/personal memory.',
  },
  {
    title: 'Reveal PIN',
    detail: 'PIN revealed via backend endpoint.',
  },
  {
    title: 'Release at panel',
    detail: 'User enters PIN at printer panel.',
  },
]

const roleCards = [
  {
    title: 'Students',
    icon: FileClock,
    points: [
      'Submit PDFs',
      'View quota/history',
      'Reveal PIN + retry storage',
    ],
  },
  {
    title: 'Admins',
    icon: ShieldCheck,
    points: [
      'Users, groups, quotas',
      'Printers and queues',
      'Dashboards + logs',
    ],
  },
  {
    title: 'Technicians',
    icon: Wrench,
    points: [
      'Active alerts',
      'Printer status context',
      'Connector/device issue handling',
    ],
  },
]

const heroGroupVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
}

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
}

function Reveal({
  children,
  className,
  amount = 0.24,
}: {
  children: React.ReactNode
  className?: string
  amount?: number
}) {
  return (
    <motion.div
      className={className}
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}

function mockupStat(label: string, value: string, tone: 'green' | 'cyan' | 'amber') {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-300/20'
      : tone === 'cyan'
        ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-300/20'
        : 'bg-amber-500/15 text-amber-300 ring-amber-300/20'

  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-[#0d2139] p-4"
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xl font-semibold text-white">{value}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs ring-1 ${toneClass}`}>Live</span>
      </div>
    </motion.div>
  )
}

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion()
  const showcaseRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
  }, [])

  const scrollToSection = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const { scrollYProgress: showcaseProgress } = useScroll({
    target: showcaseRef,
    offset: ['start end', 'end start'],
  })

  const centerCardY = useTransform(showcaseProgress, [0, 0.5, 1], [50, 0, -50])
  const centerCardRotate = useTransform(showcaseProgress, [0, 0.5, 1], [2.5, 0, -2.5])
  const chipLeftY = useTransform(showcaseProgress, [0, 1], [30, -36])
  const chipRightY = useTransform(showcaseProgress, [0, 1], [-32, 28])
  const chipOpacity = useTransform(showcaseProgress, [0.05, 0.2, 0.85, 1], [0, 1, 1, 0.2])

  return (
    <div className="bg-[#f3f7fb] text-[#0c1a2c] [font-family:Manrope,ui-sans-serif,system-ui,sans-serif]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#0f3d71_0%,#081426_45%,#050b14_100%)] pb-16 text-white">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.16),transparent_45%)]"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: [0.55, 1, 0.55],
                  scale: [1, 1.04, 1],
                }
          }
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_85%,rgba(16,185,129,0.18),transparent_55%)]"
          animate={prefersReducedMotion ? undefined : { opacity: [1, 0.65, 1] }}
          transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-5 pt-6 sm:px-8">
          <motion.header
            className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm sm:px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="mr-auto">
                <Link to="/" className="block">
                  <div className="text-lg font-semibold tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                    PrintSol
                  </div>
                  <p className="text-xs text-cyan-100/90">CCM Admin Print Management</p>
                </Link>
              </div>

              <nav aria-label="Landing sections" className="hidden items-center gap-6 text-sm text-white/72 lg:flex">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={scrollToSection(item.href)}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  to="/sign-in"
                  className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-in"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-500 px-4 text-sm font-semibold text-[#041422] transition hover:bg-emerald-400"
                >
                  Open portal
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.header>

          <motion.div
            className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]"
            variants={heroGroupVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={heroItemVariants}>
              <motion.div
                className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-cyan-100"
                variants={heroItemVariants}
              >
                Campus print operations
              </motion.div>
              <motion.h1
                className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif] sm:text-5xl lg:text-6xl"
                variants={heroItemVariants}
              >
                Secure release for campus printing, with operational visibility built in.
              </motion.h1>
              <motion.p
                className="mt-5 max-w-2xl text-base leading-7 text-[#dceaff] sm:text-lg"
                variants={heroItemVariants}
              >
                PrintSol keeps PDF jobs quota-aware and held until release. It combines backend-generated PIN
                release, connector reachability checks, retry workflows, and admin/technician visibility in one
                platform.
              </motion.p>
              <motion.div className="mt-8 flex flex-wrap items-center gap-3" variants={heroItemVariants}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/sign-in"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500 px-6 text-sm font-semibold text-[#041422] transition hover:bg-emerald-400"
                  >
                    Sign in
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </motion.div>
                <motion.a
                  href="#features"
                  onClick={scrollToSection('#features')}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-white/10"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View features
                </motion.a>
              </motion.div>
            </motion.div>

            <motion.div
              className="rounded-[1.9rem] border border-white/15 bg-[#081a2f]/90 p-3 shadow-[0_24px_55px_-28px_rgba(2,8,23,0.9)]"
              variants={heroItemVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.005 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="rounded-[1.5rem] border border-white/10 bg-[#071325] p-4 sm:p-5"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        boxShadow: [
                          '0 0 0 rgba(6,182,212,0)',
                          '0 0 0.1px rgba(16,185,129,0.35)',
                          '0 0 0 rgba(6,182,212,0)',
                        ],
                      }
                }
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <span className="size-2.5 rounded-full bg-red-400/90" />
                  <span className="size-2.5 rounded-full bg-amber-300/90" />
                  <span className="size-2.5 rounded-full bg-emerald-400/90" />
                  <div className="ml-3 rounded-full border border-white/10 bg-[#0e2139] px-3 py-1 text-xs text-slate-200">
                    ccm.printsol.local/dashboard
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)]">
                  <aside className="rounded-2xl border border-white/10 bg-[#0b1d33] p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/90">Modules</div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-200">
                      <li className="rounded-md bg-cyan-400/12 px-2 py-1.5">Dashboard</li>
                      <li className="rounded-md px-2 py-1.5">Users</li>
                      <li className="rounded-md px-2 py-1.5">Queues</li>
                      <li className="rounded-md px-2 py-1.5">Printers</li>
                      <li className="rounded-md px-2 py-1.5">Logs</li>
                    </ul>
                  </aside>

                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {mockupStat('Held jobs', '128', 'green')}
                      {mockupStat('Retries', '7', 'amber')}
                      {mockupStat('Pins today', '91', 'cyan')}
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
                      <div className="rounded-2xl border border-white/10 bg-[#0d2139] p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-300">Weekly print activity</div>
                          <ChartNoAxesCombined className="size-4 text-cyan-300" />
                        </div>
                        <div className="mt-3 h-24 rounded-xl border border-cyan-300/20 bg-[linear-gradient(170deg,#0b182b_0%,#0f3654_64%,#0f6654_100%)] p-3">
                          <div className="mt-1 h-full w-full rounded-lg border border-white/10 bg-[linear-gradient(100deg,transparent_8%,rgba(34,211,238,0.14)_42%,transparent_75%)]" />
                        </div>
                        <p className="mt-2 text-xs text-slate-300">Connector checks: 314 • Queue healthy</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#0d2139] p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-300">Tech alerts</div>
                          <AlertTriangle className="size-4 text-amber-300" />
                        </div>
                        <ul className="mt-3 space-y-2 text-xs text-slate-200">
                          <li className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-2 py-1.5">
                            HP M830 preflight warning
                          </li>
                          <li className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2 py-1.5">
                            Retry window active
                          </li>
                          <li className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-2 py-1.5">
                            Audit stream healthy
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        ref={showcaseRef}
        className="relative overflow-hidden border-y border-[#0f2238] bg-[radial-gradient(circle_at_30%_20%,#12172a_0%,#090f1d_52%,#070b14_100%)] py-20 text-white sm:py-24"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(251,146,60,0.18),transparent_45%)]"
          animate={prefersReducedMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,1.2fr)_1fr]">
          <Reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Secure print queue</p>
              <h3 className="mt-3 text-4xl font-semibold leading-tight tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                Held until release
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Jobs remain protected in queue state until students explicitly reveal their PIN and release at the
                printer panel.
              </p>
            </div>
          </Reveal>

          <div className="relative mx-auto flex min-h-[360px] w-full max-w-[420px] items-center justify-center">
            <motion.div
              className="absolute left-0 top-7 rounded-2xl border border-amber-200/20 bg-[#0a0f1b] px-4 py-3 text-sm text-amber-200"
              style={prefersReducedMotion ? undefined : { y: chipLeftY, opacity: chipOpacity }}
            >
              Encrypted PIN reveal endpoint
            </motion.div>
            <motion.div
              className="absolute right-0 top-12 rounded-2xl border border-cyan-200/20 bg-[#0a0f1b] px-4 py-3 text-sm text-cyan-200"
              style={prefersReducedMotion ? undefined : { y: chipRightY, opacity: chipOpacity }}
            >
              Connector preflight checks
            </motion.div>

            <motion.div
              className="w-full rounded-[2rem] border border-white/10 bg-[#0d1424] p-6 shadow-[0_25px_50px_-30px_rgba(2,6,23,0.95)]"
              style={prefersReducedMotion ? undefined : { y: centerCardY, rotate: centerCardRotate }}
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-[#121f36] p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-cyan-100">Presentation sequence</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                    Upload PDF
                  </div>
                  <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-cyan-200">
                    Quota-aware held job
                  </div>
                  <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-amber-200">
                    Store-on-device with retries
                  </div>
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                    Reveal PIN and release
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <Reveal>
            <div className="lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Operations control</p>
              <h3 className="mt-3 text-4xl font-semibold leading-tight tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                Visibility without overclaiming telemetry
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Admin and technician teams track alerts, retries, logs, and status context while physical output
                confirmation remains explicit future scope.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="platform" className="mx-auto -mt-4 w-full max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="rounded-[1.8rem] border border-[#113253] bg-[linear-gradient(115deg,#081c2f_0%,#0d2b45_46%,#0b3d4e_100%)] px-6 py-7 text-white sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/90">
              Live system proof
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif] sm:text-4xl">
              Real capabilities. No inflated claims.
            </h2>
            <motion.div
              className="mt-6 flex flex-wrap gap-2.5"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {proofItems.map((item) => (
                <motion.span
                  key={item}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="rounded-full border border-cyan-200/25 bg-[#071829]/55 px-3.5 py-1.5 text-xs text-cyan-50"
                >
                  {item}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </Reveal>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-5 pb-4 pt-16 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Feature signals</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f2138] [font-family:Outfit,ui-sans-serif,system-ui,sans-serif] sm:text-4xl">
            Fewer boxes. Stronger operational story.
          </h2>
        </Reveal>
        <motion.div
          className="mt-10 grid gap-x-14 lg:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.07,
              },
            },
          }}
        >
          {features.map(({ title, description, icon: Icon }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="group flex items-start gap-4 border-b border-[#cfe0ee] py-5"
            >
              <span className="mt-0.5 inline-flex rounded-full border border-[#b9d5e8] bg-[#e9f6ff] p-2 text-cyan-700 transition group-hover:scale-105">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#122a44] [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="operations" className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <Reveal>
          <div className="rounded-[1.8rem] border border-[#13324d] bg-[linear-gradient(120deg,#071628_0%,#0b2037_48%,#0e3448_100%)] p-7 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif] sm:text-4xl">
              One release rail from upload to panel PIN
            </h2>

            <div className="relative mt-10">
              <div className="absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-cyan-300/15 via-cyan-200/80 to-cyan-300/15 md:block" />
              <motion.div
                className="grid gap-6 md:grid-cols-5"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
              >
                {workflow.map((step, index) => (
                  <motion.div
                    key={step.title}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                    className="relative"
                  >
                    <div className="inline-flex size-8 items-center justify-center rounded-full border border-cyan-200/45 bg-cyan-300/15 text-xs font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-cyan-50/85">{step.detail}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="security" className="mx-auto w-full max-w-7xl px-5 py-2 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Role-based views</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10263f] [font-family:Outfit,ui-sans-serif,system-ui,sans-serif] sm:text-4xl">
            Students, admins, technicians. Clear lanes.
          </h2>
        </Reveal>
        <motion.div
          className="mt-8 overflow-hidden rounded-[1.7rem] border border-[#d6e4f0] bg-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
        >
          <div className="grid divide-y divide-[#deebf4] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {roleCards.map(({ title, icon: Icon, points }) => (
              <div key={title} className="p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-full border border-[#bfd9ea] bg-[#eef7ff] p-2 text-cyan-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-[#12283f] [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                    {title}
                  </h3>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                  {points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <Reveal className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <section>
          <div className="rounded-[1.7rem] border border-[#c5d9e9] bg-[linear-gradient(120deg,#082036_0%,#0c3f64_52%,#0b5d57_100%)] p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">
                Run campus printing with credible controls.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50">
                Open the portal to submit jobs, reveal PINs, and review operations through the existing role-based
                dashboards.
              </p>
            </div>
            <div className="mt-5 flex shrink-0 flex-wrap gap-3 sm:mt-0">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/sign-in"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500 px-6 text-sm font-semibold text-[#041422] transition hover:bg-emerald-400"
                >
                  Open sign-in
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </motion.div>
              <motion.a
                  href="#features"
                  onClick={scrollToSection('#features')}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-cyan-200 hover:bg-white/10"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Review features
              </motion.a>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="border-t border-[#d3e2ee] bg-[#091a2d] text-white" amount={0.15}>
        <footer id="contact">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <div className="text-lg font-semibold [font-family:Outfit,ui-sans-serif,system-ui,sans-serif]">PrintSol</div>
              <p className="mt-2 text-sm text-cyan-50/90">
                CCM Admin campus print-management platform for secure release, quota control, and operational recovery.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.13em] text-cyan-200">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>
                  <a href="#platform" onClick={scrollToSection('#platform')} className="transition hover:text-white">
                    Platform
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={scrollToSection('#features')} className="transition hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#operations" onClick={scrollToSection('#operations')} className="transition hover:text-white">
                    Operations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.13em] text-cyan-200">Access</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>
                  <Link to="/sign-in" className="transition hover:text-white">
                    Sign in
                  </Link>
                </li>
                <li>
                  <a href="mailto:ccm-admin@campus.local" className="transition hover:text-white">
                    ccm-admin@campus.local
                  </a>
                </li>
                <li>
                  <span className="text-slate-300">Campus project MVP</span>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </Reveal>
    </div>
  )
}
