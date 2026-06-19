import { listDocumentsAction } from "@/server/actions/documents"

export default async function DocumentsPage() {
  const result = await listDocumentsAction()

  if (!result.ok) {
    return <p className="text-red-500">Eroare: {result.error}</p>
  }

  const documents = result.data

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Documente</h1>
      </div>

      {documents.length === 0 ? (
        <p className="text-muted-foreground">Nu există documente încă.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Nume fișier</th>
                <th className="p-3 text-left font-medium">Tip</th>
                <th className="p-3 text-left font-medium">Mărime</th>
                <th className="p-3 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">{doc.file_name}</td>
                  <td className="p-3 text-muted-foreground">{doc.mime_type}</td>
                  <td className="p-3 text-muted-foreground">
                    {(doc.file_size / 1024).toFixed(1)} KB
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("ro-RO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}