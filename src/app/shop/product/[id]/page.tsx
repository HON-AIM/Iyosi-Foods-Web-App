import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProductActions from "@/components/shop/ProductActions";
import { ShieldCheck, Truck, RotateCcw, Package, Star, Heart, Share2, Check } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: Awaited<ReturnType<typeof prisma.product.findUnique>>;
  try {
    product = await prisma.product.findUnique({ where: { id } });
  } catch (err) {
    console.error("[Product] Database error fetching product:", err);
    product = null;
  }

  if (!product) {
    notFound();
  }

  let reviews: Awaited<ReturnType<typeof prisma.review.findMany>> = [];
  try {
    reviews = await prisma.review.findMany({
      where: { productId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (err) {
    console.error("[Product] Database error fetching reviews:", err);
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const originalPrice = product.price * 1.25;
  const discount = Math.round((1 - product.price / originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Promo Bar */}
      <div className="bg-primary-900 text-white text-center py-2 px-4 text-sm">
        <span className="font-semibold">FREE DELIVERY</span> on orders above ₦25,000
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 flex gap-2 items-center bg-white px-4 py-3 rounded-lg">
            <Link href="/shop" className="hover:text-primary-600 font-medium">Shop</Link>
            <span className="text-gray-300">›</span>
            <span className="capitalize text-gray-700">{product.category.toLowerCase().replace('_', ' ')}</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-900 line-clamp-1 font-medium">{product.name}</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              
              {/* Left: Product Images */}
              <div className="w-full lg:w-2/5 p-6 bg-gray-50">
                <div className="relative">
                  {discount > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg z-10">
                      -{discount}% OFF
                    </div>
                  )}
                  <div className="relative aspect-square w-full bg-white rounded-xl flex justify-center items-center shadow-sm">
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.name}
                        fill
                        className="object-contain p-8"
                        priority
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gray-100 rounded-full flex flex-col items-center justify-center text-gray-400">
                        <Package className="h-16 w-16 mb-2" />
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Add to Wishlist</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>

              {/* Center: Product Details */}
              <div className="w-full lg:w-3/5 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-100">
                {/* Official Badge */}
                <div className="inline-flex items-center gap-2 bg-primary-900 text-white text-xs font-bold px-3 py-1 rounded mb-4">
                  <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
                  OFFICIAL IYOSI FOODS STORE
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? "text-yellow-400" : "text-gray-300"} fill-current`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(127 reviews)</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-green-600 font-medium">{product.stock > 0 ? `${product.stock} items left` : 'Out of Stock'}</span>
                </div>

                {/* Price Block */}
                <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-6 mb-6">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">{formatMoney(product.price)}</h2>
                    <span className="text-lg text-gray-400 line-through">{formatMoney(originalPrice)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    + shipping from ₦1,500 to Lagos, ₦2,500 other states
                  </p>
                </div>

                {/* Size/Quantity selector mock */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Pack Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {['1kg', '2.5kg', '5kg', '10kg', '25kg'].map((size) => (
                      <button key={size} className={`px-4 py-2 border rounded-lg font-medium text-sm transition-colors ${
                        size === '5kg' 
                          ? 'border-primary-600 bg-primary-50 text-primary-700' 
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to Cart */}
                <ProductActions 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    stock: product.stock,
                    image: product.image
                  }} 
                />

                {/* Delivery Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Truck className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900">1-2 business days (Lagos), 3-5 days (Other States)</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600"><span className="font-medium text-gray-900">Genuine Product</span> - 100% Authentic</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <RotateCcw className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600"><span className="font-medium text-gray-900">Free Returns</span> within 7 days</span>
                  </div>
                </div>
              </div>

              {/* Right: Seller Info Sidebar */}
              <div className="hidden xl:block w-72 border-l border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Delivery</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="border border-gray-200 p-2 rounded bg-white">
                      <Truck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Door Delivery</h4>
                      <p className="text-xs text-gray-500 mt-1">1-2 days for Lagos, 3-5 days for other states</p>
                      <p className="text-xs text-primary-600 font-medium mt-1">₦1,500 - ₦2,500</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="border border-gray-200 p-2 rounded bg-white">
                      <RotateCcw className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Return Policy</h4>
                      <p className="text-xs text-gray-500 mt-1">Free return within 7 days if item is unused</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Sold by</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-primary-900 rounded-full flex items-center justify-center text-white font-bold">
                        I
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Iyosi Foods</p>
                        <p className="text-xs text-gray-500">Official Store</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Verified Seller</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{product.category.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Stock</span>
                  <span className="font-medium text-gray-900">{product.stock} units</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Brand</span>
                  <span className="font-medium text-gray-900">Iyosi Foods</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {review.user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.user.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "text-yellow-400" : "text-gray-300"} fill-current`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-gray-700 ml-13">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back to Shop */}
          <div className="text-center">
            <Link href="/shop" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
