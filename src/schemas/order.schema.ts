import { z } from "zod"

export const OrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(1000),
})

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(100),
  shippingAddress: z.union([
    z.string().min(5).max(500).trim(),
    z.object({
      street: z.string().min(5).max(255).trim(),
      city: z.string().min(2).max(100).trim(),
      state: z.string().min(2).max(100).trim(),
      postalCode: z.string().max(20).trim().optional().nullable(),
      country: z.string().max(100).trim().default("Nigeria"),
    }),
  ]),
  notes: z.string().max(1000).trim().optional().nullable(),
  guestName: z.string().min(2).max(100).trim().optional(),
  guestEmail: z.string().email().toLowerCase().trim().optional(),
})

export const UpdateOrderSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().max(100).trim().optional().nullable(),
  trackingCarrier: z.string().max(100).trim().optional().nullable(),
  estimatedDelivery: z.string().datetime().optional().nullable(),
  reason: z.string().max(500).trim().optional(),
})
