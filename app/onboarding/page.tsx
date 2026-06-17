"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { bootstrapTenantAction } from "@/server/actions/auth"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const [tenantName, setTenantName] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }
      const meta = user.user_metadata ?? {}
      setTenantName((meta.tenant_name as string) ?? "")
      setFullName((meta.full_name as string) ?? "")
      setReady(true)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await bootstrapTenantAction(tenantName, fullName)
    if (!result.ok) {
      setLoading(false)
      toast.error(result.error)
      return
    }
    // Refresh the session so the new profile/claims are picked up.
    const supabase = createClient()
    await supabase.auth.refreshSession()
    toast.success("Organizația a fost creată.")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <AuthShell title="Finalizați configurarea" subtitle="Confirmați detaliile organizației dumneavoastră.">
      {ready ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenantName">Numele organizației</Label>
            <Input id="tenantName" required value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Numele dumneavoastră</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Se configurează..." : "Continuați spre panou"}
          </Button>
        </form>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Se încarcă...</p>
      )}
    </AuthShell>
  )
}
