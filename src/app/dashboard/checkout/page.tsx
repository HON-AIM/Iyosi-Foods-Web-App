"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { buildWhatsAppUrl, WHATSAPP_ICON_PATH } from "@/lib/whatsapp";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const isGuest = !session?.user;
  const { items, cartTotal, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  useEffect(() => {
    async function validateCart() {
      try {
        const res = await fetch("/api/shop/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.message || "Some items in your cart have changed.");
        }
      } catch {
        setValidationError("Could not validate cart. Please refresh and try again.");
      } finally {
        setValidating(false);
      }
    }
    if (items.length > 0) validateCart();
    else setValidating(false);
  }, [items]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (shippingAddress.trim().length < 5) {
      toast.error("Please enter a valid shipping address.");
      return;
    }

    if (isGuest) {
      if (!guestName.trim() || guestName.trim().length < 2) {
        toast.error("Please enter your name");
        return;
      }
      if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          shippingAddress: shippingAddress.trim(),
          ...(isGuest && { guestName: guestName.trim(), guestEmail: guestEmail.trim().toLowerCase() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to place order. Please try again.");
        return;
      }

      const paymentRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.id }),
      });
      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        toast.error(paymentData.message || "Payment initialization failed");
        return;
      }

      setOrderId(data.id);
      clearCart();
      setPaymentUrl(paymentData.authorizationUrl);
      setOrderPlaced(true);
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderWhatsAppUrl = orderId
    ? buildWhatsAppUrl(
        `Hi Iyosiola Foods! I just placed an order (ID: ${orderId.slice(-8).toUpperCase()}). Please confirm my order. Thank you!`
      )
    : null;

  // ─── Order Confirmation ──────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Redirecting you to payment…
            </p>
          </div>
          {isGuest && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-left">
              <p className="font-semibold mb-1">Want to track your order?</p>
              <p className="mb-3">Create an account to view your order history and track deliveries.</p>
              <a href="/register" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Create Account
              </a>
            </div>
          )}
          {orderWhatsAppUrl && (
            <a
              href={orderWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#128C7E]
                text-white font-bold rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d={WHATSAPP_ICON_PATH} />
              </svg>
              Confirm Order on WhatsApp
            </a>
          )}
          {paymentUrl && (
            <a
              href={paymentUrl}
              className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
            >
              Continue to Payment
            </a>
          )}

          {/* Back to dashboard shop */}
          <Link
            href="/dashboard/shop"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl text-center transition-colors"
          >
            Continue Shopping
          </Link>

          {/* View orders */}
          <Link
            href="/dashboard/orders"
            className="flex-1 border-2 border-gray-200 hover:border-green-300 text-gray-700 font-semibold py-3 px-6 rounded-xl text-center transition-colors"
          >
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  // ─── Empty Cart Redirect ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cart is Empty</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Add some products before checking out.
            </p>
          </div>
          <Link
            href="/dashboard/shop"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Checkout ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back Link */}
        <Link
          href="/dashboard/shop"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        {isGuest && (
          <p className="text-sm text-gray-600 mb-8">
            Checking out as a guest.{" "}
            <Link href="/login?callbackUrl=/dashboard/checkout" className="text-primary-600 font-medium hover:underline">
              Log in
            </Link>{" "}
            if you already have an account.
          </p>
        )}
        {!isGuest && <div className="mb-8" />}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* ── Shipping Form ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Shipping Details
              </h2>
            </div>

            {validating && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating your cart…
              </div>
            )}
            {validationError && (
              <div className="flex items-start gap-2 text-sm text-amber-700 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-5">
              {isGuest && (
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Your Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="e.g. Amaka Johnson"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Your order confirmation will be sent here.</p>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="shippingAddress"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Delivery Address
                </label>
                <textarea
                  id="shippingAddress"
                  rows={4}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="e.g. 12 Bode Thomas Street, Surulere, Lagos, Nigeria"
                  required
                  minLength={5}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Please provide your full address including city and state.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || validating || !!validationError}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-3.5 rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  "CONTINUE TO PAYMENT"
                )}
              </button>
            </form>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 bg-primary-50 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Summary
                </h2>
              </div>

              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700 flex gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {isGuest
                  ? "All orders are processed securely. You'll receive confirmation by email."
                  : "All orders are processed securely. You'll receive a confirmation in your dashboard once placed."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
