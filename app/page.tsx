import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, ShieldCheck, KanbanSquare, Users, Lock, Activity } from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Izolare multi-tenant",
    desc: "RLS + FORCE RLS pe fiecare tabel. Datele unei organizații nu pot fi văzute de alta, niciodată.",
  },
  {
    icon: Users,
    title: "Roluri și vizibilitate",
    desc: "Agentul vede doar ce deține, managerul vede echipa, adminul vede întreaga organizație.",
  },
  {
    icon: KanbanSquare,
    title: "Pipeline Kanban",
    desc: "Lead → Contactat → Ofertă → Câștigat/Pierdut, cu validarea tranzițiilor la nivel de bază de date.",
  },
  {
    icon: Activity,
    title: "Activități și istoric",
    desc: "Apeluri, întâlniri și note legate de clienți și oportunități, cu urmărirea ultimei activități.",
  },
  {
    icon: Lock,
    title: "Securitate by design",
    desc: "Email verificat obligatoriu, protecția ultimului admin, invitații cu token securizat.",
  },
  {
    icon: Sparkles,
    title: "Pregătit pentru AI",
    desc: "Fundație curată peste care se adaugă interogarea read-only AI în fazele următoare.",
  },
]

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Nimbus CRM</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Autentificare
          </Button>
          <Button render={<Link href="/signup" />}>Începe gratuit</Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          CRM operațional B2B, sigur și multi-tenant
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          CRM-ul pentru echipe de vânzări B2B mici
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Gestionați clienți, oportunități și activități cu izolare strictă a datelor și control pe roluri. Construit pe
          o fundație de securitate solidă, peste care AI-ul doar citește și sintetizează.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/signup" />}>
            Creați-vă organizația
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent" render={<Link href="/login" />}>
            Am deja cont
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">
          Nimbus CRM — fundație operațională pentru vânzări B2B.
        </div>
      </footer>
    </main>
  )
}
