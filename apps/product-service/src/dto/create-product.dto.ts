import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateProductSchema = z
  .object({
    name: z.string().min(1),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    slug: z.string().optional(),
  })
  .strict();

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
