import React, { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, MapPin, Star } from 'lucide-react';
import {
  calculateVariantPrice,
  formatBdtPrice,
  type Language,
  type Product,
} from '../utils/storeLogic';
import { ProductIllustration } from './ProductIllustration';

interface ProductDetailModalProps {
  product: Product | null;
  language: Language;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
  onBuyNow: (productId: string, variantId: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants[1]?.id || product?.variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  if (!product) return null;

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const unitPrice = calculateVariantPrice(product.basePriceBdt, activeVariant.multiplier);

  const handleAdd = () => {
    onAddToCart(product.id, activeVariant.id, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
    >
      <div className="relative w-full max-w-4xl rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden my-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={language === 'bn' ? 'বিস্তারিত উইন্ডো বন্ধ করুন' : 'Close product details'}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          {/* Left: Sticky Visual Showcase */}
          <div className="bg-[var(--bg-surface)] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--border-subtle)]">
            <div className="aspect-[4/3] w-full rounded-lg overflow-hidden">
              <ProductIllustration
                productId={product.id}
                category={product.category}
                title={language === 'bn' ? product.nameBn : product.nameEn}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {language === 'bn' ? 'ল্যাব বিশুদ্ধতা সনদ:' : 'Lab Purity Certificate:'}
                </span>
                <span className="font-semibold text-[var(--accent-text)]">
                  {product.labCertId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {language === 'bn' ? 'সংগ্রহের মৌসুম:' : 'Harvest Window:'}
                </span>
                <span>
                  {language === 'bn' ? product.harvestSeasonBn : product.harvestSeasonEn}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {language === 'bn' ? 'পুষ্টিমান (প্রতি ১০০ গ্রাম):' : 'Nutrition (per 100g):'}
                </span>
                <span className="tabular-nums">{product.nutritionPer100g.calories}</span>
              </div>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Quiet Unboxed Metadata Kicker */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--accent-text)]">
                  {language === 'bn' ? product.categoryLabelBn : product.categoryLabelEn}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {language === 'bn' ? product.originBn : product.originEn}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </div>

              <h2
                id="pdp-modal-title"
                className="mt-2 text-2xl font-bold text-[var(--text-primary)] leading-snug"
              >
                {language === 'bn' ? product.nameBn : product.nameEn}
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {language === 'bn' ? product.nameEn : product.nameBn}
              </p>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums text-[var(--accent-text)]">
                  {formatBdtPrice(unitPrice, language)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  / {language === 'bn' ? activeVariant.labelBn : activeVariant.labelEn}
                </span>
                <span className="text-xs font-semibold text-[var(--accent-text)]">
                  · {language === 'bn' ? 'স্টকে আছে' : 'In Stock & Ready to Dispatch'}
                </span>
              </div>

              <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                {language === 'bn' ? product.descriptionBn : product.descriptionEn}
              </p>

              {/* Variant Selector */}
              <div className="mt-6">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  {language === 'bn' ? 'প্যাক সাইজ নির্বাচন করুন:' : 'Select Pack Weight:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = variant.id === activeVariant.id;
                    const vPrice = calculateVariantPrice(
                      product.basePriceBdt,
                      variant.multiplier
                    );
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-900/15 text-[var(--text-primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-emerald-600'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">
                          {language === 'bn' ? variant.labelBn : variant.labelEn}
                        </div>
                        <div className="text-xs font-bold tabular-nums text-[var(--accent-text)] mt-0.5">
                          {formatBdtPrice(vPrice, language)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {language === 'bn' ? 'পরিমাণ (Quantity):' : 'Quantity:'}
                </span>
                <div className="inline-flex items-center rounded-lg border border-stone-300 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="px-3 py-1.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="px-3 py-1.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Primary & Secondary Purchase Actions */}
            <div className="mt-8 pt-4 border-t border-stone-200 dark:border-emerald-900/50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-stone-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {language === 'bn' ? 'ব্যাগে যুক্ত হয়েছে' : 'Added to Bag'}
                    </span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {language === 'bn'
                        ? `ব্যাগে যোগ করুন · ${formatBdtPrice(unitPrice * quantity, language)}`
                        : `Add to Bag · ${formatBdtPrice(unitPrice * quantity, language)}`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onBuyNow(product.id, activeVariant.id, quantity);
                }}
                className="px-5 py-3 rounded-lg border border-emerald-900 dark:border-emerald-400 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-900/10 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                {language === 'bn' ? 'সরাসরি চেকআউট' : 'Instant Checkout'}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
              <span>
                {language === 'bn'
                  ? '১০০% কেমিক্যাল মুক্ত গ্যারান্টি · বিকাশ, নগদ, কার্ড ও ক্যাশ অন ডেলিভারি'
                  : '100% Chemical-Free Guarantee · bKash, Nagad, SSLCommerz & COD'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
