"use client";

import { useCart } from "@/context/CartContext";
import { X, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartSidebar() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotal } = useCart();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const FREE_DELIVERY_THRESHOLD = 25000;
  const deliveryProgress = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-bold">Your Cart ({items.length})</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
            {amountToFreeDelivery > 0 ? (
              <>
                <p className="text-xs text-gray-700 mb-1.5">
                  Add <span className="font-bold text-orange-600">{formatMoney(amountToFreeDelivery)}</span> more for <span className="font-bold text-green-600">FREE delivery</span>
                </p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${deliveryProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-700">
                <Truck className="h-4 w-4" />
                <p className="text-xs font-bold">🎉 You qualify for FREE delivery!</p>
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-900">Your cart is empty!</p>
              <p className="text-sm">Browse our store and add items to your cart.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden relative bg-white">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-gray-300 m-auto mt-5" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-green-700 font-bold text-sm mt-0.5">{formatMoney(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center border border-gray-200 rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400">{item.stock} left</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-5 bg-white">
            <div className="flex justify-between text-base font-bold text-gray-900 mb-4">
              <p>Subtotal</p>
              <p className="text-green-700">{formatMoney(cartTotal)}</p>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex justify-center items-center py-3.5 rounded-lg font-bold shadow-lg transition-colors text-sm"
            >
              CHECKOUT ({formatMoney(cartTotal)})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
