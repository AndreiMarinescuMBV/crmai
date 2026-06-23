import { z } from "zod"

export const aiDocumentsQuerySchema = z
  .object({
    question: z.string().min(3, "Întrebarea e prea scurtă").max(1000),
    client_id: z.string().uuid().optional(),
    deal_id: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.client_id) !== Boolean(data.deal_id), {
    message: "Trebuie specificat exact un context: client SAU deal",
  })