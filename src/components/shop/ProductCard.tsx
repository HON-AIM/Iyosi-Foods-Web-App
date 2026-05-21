"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, BadgeCheck } from "lucide-react";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const inStock = product.stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      },
      1
    );
  };

  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="group bg-white rounded-lg border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200 flex flex-col h-full overflow-hidden relative"
    >
      {/* Low Stock Badge */}
      {product.stock <= 5 && product.stock > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
         {product.stock} left!
        </div>
      )}

      {/* Out of Stock Badge */}
      {product.stock === 0 && (
        <div className="absolute top-2 left-2 z-10 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          Out of Stock
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-3 mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 flex flex-col flex-1">
        {/* Official badge */}
        <div className="flex items-center gap-1 mb-1">
          <BadgeCheck className="h-3 w-3 text-blue-500" />
          <span className="text-[9px] text-blue-600 font-semibold uppercase">Official Store</span>
        </div>

        {/* Title */}
        <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-1.5 group-hover:text-orange-600 transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Price Block */}
        <div className="mt-auto">
          <p className="font-bold text-sm md:text-base text-gray-900">
            {formatMoney(product.price)}
          </p>
        </div>

        {/* Free delivery indicator */}
        {product.price >= 25000 && (
          <p className="text-[9px] text-green-600 font-semibold mt-1 flex items-center gap-0.5">
            🚚 Free delivery
          </p>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-2.5 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5 md:opacity-0 md:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 shadow-sm"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {product.stock === 0 ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>
    </Link>
  );
}
