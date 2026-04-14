import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Tag,
  Package,
  Upload,
  ChevronDown,
  Search,
  Copy,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  IndianRupee,
  Percent,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CommissionTier {
  discountValue: 50 | 100 | 150;
  baseCommission: number; // ₹ earned by seller after discount is subtracted
}

interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  storeUrl: string;
  description: string;
  price: number;
  commissionTiers: CommissionTier[];
  couponsPerUser: number;
  totalCouponsPool: number;
  usedCoupons: number;
  active: boolean;
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    name: "GrowthGurukul Pro Course",
    category: "Digital Course",
    imageUrl: "https://placehold.co/200x200/003D1F/69F0AE?text=Course",
    storeUrl: "https://growthgurukul.store/pro",
    description: "Complete digital marketing mastery course",
    price: 2999,
    commissionTiers: [
      { discountValue: 50, baseCommission: 350 },
      { discountValue: 100, baseCommission: 400 },
      { discountValue: 150, baseCommission: 450 },
    ],
    couponsPerUser: 5,
    totalCouponsPool: 500,
    usedCoupons: 143,
    active: true,
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "prod_002",
    name: "Branding Toolkit",
    category: "Digital Product",
    imageUrl: "https://placehold.co/200x200/003D1F/69F0AE?text=Toolkit",
    storeUrl: "https://growthgurukul.store/toolkit",
    description: "Logo templates, colour guides, brand identity kit",
    price: 999,
    commissionTiers: [
      { discountValue: 50, baseCommission: 150 },
      { discountValue: 100, baseCommission: 200 },
      { discountValue: 150, baseCommission: 250 },
    ],
    couponsPerUser: 5,
    totalCouponsPool: 300,
    usedCoupons: 67,
    active: true,
    createdAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "prod_003",
    name: "Freelance Starter Pack",
    category: "Bundle",
    imageUrl: "https://placehold.co/200x200/003D1F/69F0AE?text=Pack",
    storeUrl: "https://growthgurukul.store/freelance",
    description: "Proposal templates, rate card calculator, client scripts",
    price: 499,
    commissionTiers: [
      { discountValue: 50, baseCommission: 80 },
      { discountValue: 100, baseCommission: 100 },
      { discountValue: 150, baseCommission: 120 },
    ],
    couponsPerUser: 5,
    totalCouponsPool: 200,
    usedCoupons: 12,
    active: false,
    createdAt: "2026-04-01T00:00:00Z",
  },
];

const CATEGORIES = ["Digital Course", "Digital Product", "Bundle", "Physical Product", "Subscription"];

// ── Commission Tier Editor ────────────────────────────────────────────────────
function CommissionTierEditor({
  tiers,
  onChange,
}: {
  tiers: CommissionTier[];
  onChange: (tiers: CommissionTier[]) => void;
}) {
  const discountValues: Array<50 | 100 | 150> = [50, 100, 150];

  const updateCommission = (dv: 50 | 100 | 150, val: number) => {
    onChange(
      tiers.map((t) => (t.discountValue === dv ? { ...t, baseCommission: val } : t))
    );
  };

  const getTier = (dv: 50 | 100 | 150) =>
    tiers.find((t) => t.discountValue === dv) ?? { discountValue: dv, baseCommission: 0 };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission Tiers</p>
      {discountValues.map((dv) => {
        const tier = getTier(dv);
        const netEarning = tier.baseCommission - dv;
        return (
          <div key={dv} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1 w-24 flex-shrink-0">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">₹{dv} off</span>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Base commission (₹)</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mt-1 bg-white">
                <span className="px-2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={tier.baseCommission}
                  onChange={(e) => updateCommission(dv, Number(e.target.value))}
                  className="flex-1 py-1.5 pr-3 text-sm focus:outline-none"
                  min={0}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">Net earning</p>
              <p className={`text-sm font-bold ${netEarning >= 0 ? "text-green-600" : "text-red-500"}`}>
                ₹{netEarning}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Partial<Product> | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const isNew = !product?.id;
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    category: CATEGORIES[0],
    imageUrl: "",
    storeUrl: "",
    description: "",
    price: 999,
    commissionTiers: [
      { discountValue: 50, baseCommission: 150 },
      { discountValue: 100, baseCommission: 200 },
      { discountValue: 150, baseCommission: 250 },
    ],
    couponsPerUser: 5,
    totalCouponsPool: 200,
    usedCoupons: 0,
    active: true,
    ...product,
  });

  const set = (key: keyof Product, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name?.trim() || !form.storeUrl?.trim()) return;
    onSave({
      ...form,
      id: form.id ?? `prod_${Date.now()}`,
      createdAt: form.createdAt ?? new Date().toISOString(),
    } as Product);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {isNew ? "Add New Product" : "Edit Product"}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name ?? ""}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. GrowthGurukul Pro Course"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Price (₹) *
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                  <span className="px-3 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={form.price ?? 0}
                    onChange={(e) => set("price", Number(e.target.value))}
                    className="flex-1 py-3 pr-3 text-sm focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Store URL *
                </label>
                <input
                  type="url"
                  value={form.storeUrl ?? ""}
                  onChange={(e) => set("storeUrl", e.target.value)}
                  placeholder="https://growthgurukul.store/..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.imageUrl ?? ""}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                />
              </div>
            </div>

            {/* Commission tiers */}
            <CommissionTierEditor
              tiers={form.commissionTiers ?? []}
              onChange={(t) => set("commissionTiers", t)}
            />

            {/* Coupon settings */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Coupon Settings
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Coupons per user</label>
                  <input
                    type="number"
                    value={form.couponsPerUser ?? 5}
                    onChange={(e) => set("couponsPerUser", Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Total coupon pool</label>
                  <input
                    type="number"
                    value={form.totalCouponsPool ?? 200}
                    onChange={(e) => set("totalCouponsPool", Number(e.target.value))}
                    min={0}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Active</p>
                <p className="text-xs text-gray-500">Show this product in DealSell</p>
              </div>
              <button
                onClick={() => set("active", !form.active)}
                className="text-brand-green"
              >
                {form.active ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dim transition-colors"
            >
              {isNew ? "Add Product" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const poolPct = Math.round((product.usedCoupons / product.totalCouponsPool) * 100);
  const poolWarning = poolPct > 80;

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Image + status */}
      <div className="relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-36 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              product.active
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {product.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Title + category */}
        <div>
          <span className="text-xs font-medium text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
          <h3 className="font-semibold text-gray-900 mt-1.5 text-sm leading-tight">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
        </div>

        {/* Price + commission summary */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-gray-700 font-semibold">
            <IndianRupee className="w-3.5 h-3.5" />
            {product.price.toLocaleString("en-IN")}
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <Percent className="w-3 h-3" />
            Up to ₹{Math.max(...product.commissionTiers.map((t) => t.baseCommission - t.discountValue))} net
          </div>
        </div>

        {/* Coupon pool progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Coupon pool</span>
            <span className={poolWarning ? "text-amber-600 font-semibold" : "text-gray-600"}>
              {product.usedCoupons}/{product.totalCouponsPool}
              {poolWarning && <AlertTriangle className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                poolWarning ? "bg-amber-400" : "bg-brand-green"
              }`}
              style={{ width: `${Math.min(poolPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={onToggle}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
              product.active
                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {product.active ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-100 text-red-400 text-xs font-semibold hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DealSellProducts() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [modalProduct, setModalProduct] = useState<Partial<Product> | null | false>(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const displayed = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (p: Product) => {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]
    );
    setModalProduct(false);
  };

  const handleToggle = (id: string) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const activeCount = products.filter((p) => p.active).length;
  const totalPool = products.reduce((s, p) => s + p.totalCouponsPool, 0);
  const usedPool = products.reduce((s, p) => s + p.usedCoupons, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DealSell Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage GrowthGurukul.store products available in the DealSell engine
          </p>
        </div>
        <button
          onClick={() => setModalProduct({})}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-green-dim transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Products", value: products.length, icon: Package, color: "text-gray-700" },
          { label: "Active", value: activeCount, icon: CheckCircle, color: "text-green-600" },
          { label: "Coupons Used", value: `${usedPool}/${totalPool}`, icon: Tag, color: "text-brand-green" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
        />
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {displayed.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setModalProduct(product)}
              onToggle={() => handleToggle(product.id)}
              onDelete={() => setDeleteConfirm(product.id)}
            />
          ))}
        </AnimatePresence>

        {displayed.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No products found.</p>
          </div>
        )}
      </div>

      {/* Product modal */}
      {modalProduct !== false && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
