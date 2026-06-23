import { createClient } from "@/lib/supabase/server"
import { getTenantContext } from "@/lib/guards"
import { AiDocumentsClientPicker } from "@/components/dashboard/ai-documents-client-picker"

export default async function AiDocumentsPage() {
  const ctx = await getTenantContext()
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name")

  const { data: deals } = await supabase
    .from("deals")
    .select("id, title")
    .order("title")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documente Mode (AI)</h1>
        <p className="text-sm text-muted-foreground">
          Întreabă AI-ul despre conținutul documentelor unui client sau deal.
        </p>
      </div>

      <AiDocumentsClientPicker clients={clients ?? []} deals={deals ?? []} />
    </div>
  )
}