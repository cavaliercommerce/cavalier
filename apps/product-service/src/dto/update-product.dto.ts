import { createZodDto } from "nestjs-zod";
import z from "zod";

const UpdateProductSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().positive(),
    name: z.string().min(1).optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    slug: z.string().optional(),
  })
  .strict();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
