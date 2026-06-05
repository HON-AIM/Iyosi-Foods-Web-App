import { z } from "zod"

export const ProductSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().min(10).max(2000).trim(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  image: z.string().url().nullable().optional(),
  category: z.enum([
    "BAKING",
    "WHEAT",
    "ALL_PURPOSE",
    "SEMOLINA",
    "SUGAR",
    "OIL",
    "RICE",
    "TOMATO_PASTE",
  ]).default("BAKING"),
})
