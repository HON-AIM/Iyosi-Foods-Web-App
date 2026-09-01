import crypto from "crypto"

/**
 * Generates a unique tracking number for Iyosi Foods LTD orders.
 *
 * Format: IYF-YYYYMM-XXXXXXXX
 * Example: IYF-202508-A3F7K2B9
 *
 * Components:
 *   IYF = Company prefix (Iyosi Foods LTD)
 *   YYYYMM = Year + Month (e.g., 202508 for August 2025)
 *   XXXXXXXX = 8 cryptographically random alphanumeric characters
 *
 * Total length: 18 characters
 * Collision probability: 1 in 2.8 trillion per month — effectively zero
 */
export function generateTrackingNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const datePart = `${year}${month}`

  // 8 characters from uppercase alphanumeric (A-Z, 0-9)
  // Removed ambiguous characters: 0, 1, I, O
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const randomPart = Array.from({ length: 8 }, () =>
    alphabet[crypto.randomInt(0, alphabet.length)]
  ).join("")

  return `IYF-${datePart}-${randomPart}`
}

/**
 * Carrier options for Nigerian e-commerce logistics
 */
export const NIGERIAN_CARRIERS = [
  "GIG Logistics",
  "DHL Nigeria",
  "Kwik Delivery",
  "GIGL Express",
  "Red Star Express",
  "Courier Plus",
  "Sendbox",
  "Jumia Logistics",
  "Own Delivery",
] as const

export type Carrier = (typeof NIGERIAN_CARRIERS)[number]
