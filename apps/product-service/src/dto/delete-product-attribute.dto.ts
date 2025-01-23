import { createZodDto } from "nestjs-zod";
import z from "zod";

export const DeleteProductAttributeSchema = z
  .object({
    tenantId: z.string().uuid(),
    productId: z.string().uuid(),
    version: z.number().positive(),
    key: z.string().min(1),
  })
  .strict();

export class DeleteProductAttributeDto extends createZodDto(DeleteProductAttributeSchema) {}
