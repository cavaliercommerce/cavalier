import { createZodDto } from "nestjs-zod";
import z from "zod";

const DeleteProductVariantSchema = z
  .object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    version: z.number().positive(),
  })
  .strict();

export class DeleteProductVariantDto extends createZodDto(DeleteProductVariantSchema) {}
