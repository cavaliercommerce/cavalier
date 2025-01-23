import { createZodDto } from "nestjs-zod";
import z from "zod";

export const DeleteProductSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number(),
    tenantId: z.string().uuid(),
  })
  .strict();

export class DeleteProductDto extends createZodDto(DeleteProductSchema) {}
