"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MailCheck } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback?next=/onboarding`,
        data: { full_name: fullName, tenant_name: tenantName },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Verificați-vă emailul" subtitle="Ați făcut primul pas.">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Am trimis un link de confirmare la <span className="font-medium text-foreground">{email}</span>. Confirmați
            emailul, apoi veți finaliza configurarea organizației.
          </p>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/login">Înapoi la autentificare</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Creați-vă organizația"
      subtitle="Primul utilizator devine administratorul organizației."
      footer={
        <>
          Aveți deja cont?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Autentificare
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tenantName">Numele organizației</Label>
          <Input
            id="tenantName"
            required
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Firma mea SRL"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Numele dumneavoastră</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ion Popescu"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume@firma.ro"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Parolă</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minim 8 caractere"
          />
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Se creează..." : "Creați organizația"}
        </Button>
      </form>
    </AuthShell>
  )
}
