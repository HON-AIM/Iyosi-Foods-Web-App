"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

type VerifyState = "idle" | "loading" | "success" | "error"

export default function PaymentVerifyBanner() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerifyState>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return
    if (typeof window === "undefined") return

    const raw = sessionStorage.getItem("iyosi_pending_order")
    if (!raw) return
    sessionStorage.removeItem("iyosi_pending_order")

    let pending: { id: string; token?: string }
    try {
      pending = JSON.parse(raw)
    } catch {
      return
    }

    setState("loading")
    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: pending.id, orderToken: pending.token || undefined }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.confirmed) {
          setState("success")
          setMessage("Payment confirmed — your order is being processed.")
        } else {
          setState("error")
          setMessage(
            data.message ||
              "We could not confirm your payment yet. If you were charged, please contact support."
          )
        }
      })
      .catch(() => {
        setState("error")
        setMessage(
          "We could not confirm your payment yet. If you were charged, please contact support."
        )
      })
  }, [searchParams])

  if (state === "idle") return null

  return (
    <div
      className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
        state === "loading"
          ? "bg-blue-50 border-blue-200"
          : state === "success"
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
      }`}
    >
      {state === "loading" ? (
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
      ) : state === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {state === "loading"
            ? "Verifying your payment…"
            : state === "success"
              ? "Payment Successful"
              : "Payment Pending"}
        </p>
        <p className="text-sm text-gray-600 mt-0.5">{message}</p>
      </div>
    </div>
  )
}