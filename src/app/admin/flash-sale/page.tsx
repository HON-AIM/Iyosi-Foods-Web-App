"use client"
import { useState, useEffect } from "react"
import { Zap, Search, Save, Clock } from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"

type Product = {
  id: string; name: string; price: number; stock: number;
  image: string | null; category: string; isFlashSale: boolean;
  flashSalePrice: number | null; flashSaleEndsAt: string | null;
}

type Settings = {
  flashSaleTitle: string | null; flashSaleActive: boolean;
  flashSaleEndTime: string | null;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

export default function FlashSaleManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<Settings>({ flashSaleTitle: "Flash Sale", flashSaleActive: false, flashSaleEndTime: null })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [editPrices, setEditPrices] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/admin/flash-sale")
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || [])
        if (data.settings) setSettings(data.settings)
        const prices: Record<string, string> = {}
        data.products?.forEach((p: Product) => {
          if (p.flashSalePrice) prices[p.id] = String(p.flashSalePrice)
        })
        setEditPrices(prices)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleFlashSale = async (productId: string, currentState: boolean) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const salePrice = editPrices[productId] ? parseFloat(editPrices[productId]) : null
    if (!currentState && salePrice && salePrice >= product.price) {
      toast.error("Flash sale price must be LOWER than the regular price")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/flash-sale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [productId],
          isFlashSale: !currentState,
          flashSalePrice: !currentState ? salePrice : null,
          flashSaleEndsAt: settings.flashSaleEndTime,
        }),
      })
      if (!res.ok) { toast.error("Update failed"); return }
      setProducts(prev => prev.map(p => p.id === productId
        ? { ...p, isFlashSale: !currentState, flashSalePrice: !currentState ? salePrice : null }
        : p
      ))
      toast.success(!currentState ? "Added to flash sale" : "Removed from flash sale")
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/flash-sale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "settings", ...settings }),
      })
      if (res.ok) toast.success("Flash sale settings saved")
      else toast.error("Failed to save settings")
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const flashSaleCount = products.filter(p => p.isFlashSale).length
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500 fill-orange-500" /> Flash Sale Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">{flashSaleCount} products currently in flash sale</p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" /> Flash Sale Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Title</label>
            <input
              value={settings.flashSaleTitle || ""}
              onChange={e => setSettings(s => ({ ...s, flashSaleTitle: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="e.g. Weekend Flash Sale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale End Time</label>
            <input
              type="datetime-local"
              value={settings.flashSaleEndTime ? new Date(settings.flashSaleEndTime).toISOString().slice(0, 16) : ""}
              onChange={e => setSettings(s => ({ ...s, flashSaleEndTime: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Flash Sale Active</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, flashSaleActive: !s.flashSaleActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.flashSaleActive ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.flashSaleActive ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
              <span className={`text-sm font-semibold ${settings.flashSaleActive ? "text-green-600" : "text-gray-400"}`}>
                {settings.flashSaleActive ? "LIVE" : "OFF"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={saveSettings} disabled={saving}
          className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900">Select Products for Flash Sale</h2>
          <div className="relative flex-shrink-0 w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No products found</div>
          )}
          {filtered.map(product => (
            <div key={product.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${product.isFlashSale ? "bg-orange-50" : ""}`}>
              {/* Image */}
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                {product.image
                  ? <Image src={product.image} alt={product.name} fill className="object-cover" sizes="56px" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">No img</div>
                }
              </div>
              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{product.category.replace("_", " ")}</p>
                <p className="text-sm font-bold text-gray-700 mt-0.5">{formatMoney(product.price)}</p>
              </div>
              {/* Sale price input */}
              <div className="flex-shrink-0 w-36">
                <label className="block text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Sale Price (₦)</label>
                <input
                  type="number"
                  value={editPrices[product.id] || ""}
                  onChange={e => setEditPrices(prev => ({ ...prev, [product.id]: e.target.value }))}
                  placeholder={String(Math.round(product.price * 0.8))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggleFlashSale(product.id, product.isFlashSale)}
                disabled={saving}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                  ${product.isFlashSale
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                <Zap className={`w-3.5 h-3.5 ${product.isFlashSale ? "fill-orange-500 text-orange-500" : ""}`} />
                {product.isFlashSale ? "In Sale" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
