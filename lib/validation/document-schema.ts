import { z } from "zod"

export const documentSchema = z
  .object({
    file_name: z.string().min(1, "Numele fișierului este obligatoriu"),
    mime_type: z.string().min(1),
    file_size: z.number().positive(),
    storage_path: z.string().min(1),
    client_id: z.string().uuid().optional(),
    deal_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => Boolean(data.client_id) !== Boolean(data.deal_id),
    {
      message: "Documentul trebuie să aparțină fie unui client, fie unui deal",
    }
  )

export type DocumentInput = z.infer<typeof documentSchema>