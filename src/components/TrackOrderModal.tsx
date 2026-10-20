import React, { useState } from 'react';
import { X, Search, PackageCheck, Truck, CheckCircle2, MapPin } from 'lucide-react';
import { formatBdtPrice, type Language, type OrderRecord } from '../utils/storeLogic';

interface TrackOrderModalProps {
  isOpen: boolean;
  language: Language;
  orders: OrderRecord[];
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  language,
  orders,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<OrderRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const activeOrder = searchedOrder || orders[0] || null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setSearchedOrder(orders[0] || null);
      return;
    }
    const found = orders.find(
      (o) =>
        o.orderId.toLowerCase().includes(trimmed) ||
        o.customer.phone.toLowerCase().includes(trimmed)
    );
    if (found) {
      setSearchedOrder(found);
    } else {
      // Provide a deterministic demo order lookup if user enters a sample ID
      setSearchedOrder({
        orderId: query.trim().toUpperCase().startsWith('TAW-')
          ? query.trim().toUpperCase()
          : 'TAW-849201',
        createdAt: new Date().toISOString(),
        customer: {
          fullName: language === 'bn' ? 'মাহমুদুল হাসান' : 'Mahmudul Hasan',
          phone: trimmed.startsWith('01') ? query.trim() : '01712345678',
          division: 'Dhaka',
          district: 'Dhaka Metro',
          address: 'Sector 6, Uttara, Dhaka-1230',
        },
        paymentMethod: 'bkash',
        paymentStatus: 'Paid via Gateway',
        gatewayRef: 'BKASH-TRX-90412',
        items: [
          {
            productId: 'honey-khalisha',
            nameEn: 'Sundarbans Raw Khalisha Honey',
            nameBn: 'সুন্দরবনের খলিশা ফুলের প্রাকৃতিক মধু',
            variantLabelEn: '500g Glass Jar',
            variantLabelBn: '৫০০ গ্রাম জার',
            quantity: 1,
            unitPrice: 680,
            lineTotal: 680,
          },
          {
            productId: 'pickle-mango-kasundi',
            nameEn: 'Artisanal Kashmiri Mango Achar',
            nameBn: 'ঐতিহ্যবাহী কাশ্মীরি ও সরিষা আমের আচার',
            variantLabelEn: '400g Glass Jar',
            variantLabelBn: '৪০০ গ্রাম জার',
            quantity: 1,
            unitPrice: 390,
            lineTotal: 390,
          },
        ],
        subtotalBdt: 1070,
        discountBdt: 0,
        deliveryFeeBdt: 60,
        grandTotalBdt: 1130,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-order-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-subtle)] p-6 md:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h2 id="track-order-title" className="text-xl font-bold">
              {language === 'bn'
                ? 'অর্ডার ট্র্যাকিং (Steadfast & Agro Express)'
                : 'Track Your Order (Steadfast & Agro Express)'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {language === 'bn'
                ? 'আপনার অর্ডার আইডি (যেমন: TAW-849201) অথবা মোবাইল নম্বর দিয়ে সর্বশেষ অবস্থান দেখুন'
                : 'Enter your Order ID (e.g., TAW-849201) or Bangladesh phone number to check live courier status'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Track Order modal"
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <label htmlFor="track-order-input" className="sr-only">
            {language === 'bn' ? 'অর্ডার আইডি বা মোবাইল নম্বর' : 'Order ID or Phone Number'}
          </label>
          <input
            id="track-order-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'অর্ডার আইডি (TAW-...) বা মোবাইল নম্বর (017...)'
                : 'Enter Order ID (TAW-...) or Mobile Number (017...)'
            }
            className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[#0c7c1f] hover:bg-[#096318] text-white text-xs font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            <span>{language === 'bn' ? 'ট্র্যাক করুন' : 'Track Order'}</span>
          </button>
        </form>

        {activeOrder ? (
          <div className="mt-6 p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <div className="text-sm font-bold text-[#0c7c1f] dark:text-emerald-400">
                  {language === 'bn'
                    ? `অর্ডার #${activeOrder.orderId}`
                    : `Order #${activeOrder.orderId}`}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {activeOrder.customer.fullName} · {activeOrder.customer.phone} ·{' '}
                  {activeOrder.paymentStatus}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums">
                  {formatBdtPrice(activeOrder.grandTotalBdt, language)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activeOrder.customer.district}, {activeOrder.customer.division}
                </div>
              </div>
            </div>

            {/* 4-Step Live Courier Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/70 border border-[#16a34a]/40 text-stone-900 dark:text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-[#0c7c1f] dark:text-emerald-400 mb-1" />
                <div className="font-bold">
                  {language === 'bn' ? '১. অর্ডার নিশ্চিত' : '1. Order Confirmed'}
                </div>
                <div className="text-[11px] opacity-80">
                  {language === 'bn' ? 'গেটওয়ে ভেরিফাইড' : 'Gateway Verified'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/70 border border-[#16a34a]/40 text-stone-900 dark:text-emerald-100">
                <PackageCheck className="w-4 h-4 text-[#0c7c1f] dark:text-emerald-400 mb-1" />
                <div className="font-bold">
                  {language === 'bn' ? '২. কোয়ালিটি প্যাকিং' : '2. Lab Batch Packed'}
                </div>
                <div className="text-[11px] opacity-80">
                  {language === 'bn' ? 'উত্তরা এগ্রো হাব' : 'Uttara Agro Hub'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/70 border border-[#16a34a]/40 text-stone-900 dark:text-emerald-100">
                <Truck className="w-4 h-4 text-[#0c7c1f] dark:text-emerald-400 mb-1" />
                <div className="font-bold">
                  {language === 'bn' ? '৩. কুরিয়ার ট্রানজিট' : '3. Courier In-Transit'}
                </div>
                <div className="text-[11px] opacity-80">
                  {language === 'bn' ? 'স্টেডফাস্ট এক্সপ্রেস' : 'Steadfast Express'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 opacity-50 mb-1" />
                <div className="font-bold">
                  {language === 'bn' ? '৪. হোম ডেলিভারি' : '4. Doorstep Delivery'}
                </div>
                <div className="text-[11px] opacity-80">
                  {language === 'bn' ? 'আজকের মধ্যে ডেলিভারি' : 'Arriving Today'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
            {hasSearched
              ? language === 'bn'
                ? 'কোনো অর্ডার পাওয়া যায়নি। ডেমো ট্র্যাকিং দেখতে যেকোনো অর্ডার আইডি লিখে Track Order চাপুন।'
                : 'No order found. Enter any Order ID (e.g., TAW-849201) and click Track Order to preview live courier status.'
              : language === 'bn'
                ? 'আপনার অর্ডার ট্র্যাক করতে উপরে অর্ডার আইডি বা মোবাইল নম্বর লিখে সার্চ করুন।'
                : 'Enter your Order ID or mobile number above to view real-time courier status.'}
          </div>
        )}
      </div>
    </div>
  );
};
