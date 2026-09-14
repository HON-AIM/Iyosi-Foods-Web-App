const PAYSTACK_API = "https://api.paystack.co"

function paystackHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ""}`,
    "Content-Type": "application/json",
  }
}

export interface PaystackVerifiedTransaction {
  status: string
  reference: string
  amount: number
  currency: string
  paid_at: string | null
  [key: string]: unknown
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifiedTransaction> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: paystackHeaders(),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack verify failed (${res.status})`)
  }
  return body.data as PaystackVerifiedTransaction
}

export interface PaystackRefund {
  id: number
  transaction: {
    reference: string
    status: string
    amount: number
  } | null
  status: string
  createdAt: string | null
  [key: string]: unknown
}

export async function refundTransaction(reference: string, amountKobo: number): Promise<PaystackRefund> {
  const res = await fetch(`${PAYSTACK_API}/refund`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({ transaction: reference, amount: amountKobo }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack refund failed (${res.status})`)
  }
  return body.data as PaystackRefund
}
