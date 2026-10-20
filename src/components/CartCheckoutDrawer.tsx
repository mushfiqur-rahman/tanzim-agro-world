import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Truck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  formatBdtPrice,
  validateCheckoutInput,
  type CartSummary,
  type CheckoutFormInput,
  type Language,
  type OrderRecord,
  type PaymentMethodId,
} from '../utils/storeLogic';
import { BD_DIVISIONS } from '../data/products';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  language: Language;
  cartSummary: CartSummary;
  division: string;
  promoCode: string;
  onChangeDivision: (division: string) => void;
  onChangePromoCode: (code: string) => void;
  onUpdateQuantity: (productId: string, variantId: string, delta: number) => void;
  onClearCart: () => void;
  onCompleteOrder: (order: OrderRecord) => void;
  onClose: () => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  language,
  cartSummary,
  division,
  promoCode,
  onChangeDivision,
  onChangePromoCode,
  onUpdateQuantity,
  onCompleteOrder,
  onClose,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [promoInput, setPromoInput] = useState(promoCode);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka Metro');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bkash');
  const [transactionPinOrRef, setTransactionPinOrRef] = useState('4829');
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormInput, string>>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const activeDivisionObj =
    BD_DIVISIONS.find((d) => d.id === division) || BD_DIVISIONS[0];

  const handleDivisionSelect = (newDiv: string) => {
    onChangeDivision(newDiv);
    const found = BD_DIVISIONS.find((d) => d.id === newDiv);
    if (found && found.districts.length > 0) {
      setDistrict(found.districts[0].nameEn);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const formInput: CheckoutFormInput = {
      fullName,
      phone,
      division,
      district,
      address,
      paymentMethod,
      transactionPinOrRef,
    };

    const validation = validateCheckoutInput(formInput, language);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const orderNumber = `TAW-${Math.floor(100000 + Math.random() * 900000)}`;
    const gatewayPrefix =
      paymentMethod === 'bkash'
        ? 'BKASH-TRX-'
        : paymentMethod === 'nagad'
          ? 'NAGAD-TXN-'
          : paymentMethod === 'card'
            ? 'SSLC-AUTH-'
            : 'COD-VERIFIED-';

    const newOrder: OrderRecord = {
      orderId: orderNumber,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        division,
        district,
        address: address.trim(),
      },
      paymentMethod,
      paymentStatus:
        paymentMethod === 'cod' ? 'Cash on Delivery Verified' : 'Paid via Gateway',
      gatewayRef: `${gatewayPrefix}${Math.floor(10000 + Math.random() * 89999)}`,
      items: cartSummary.items.map((item) => ({
        productId: item.productId,
        nameEn: item.product.nameEn,
        nameBn: item.product.nameBn,
        variantLabelEn: item.variant.labelEn,
        variantLabelBn: item.variant.labelBn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotalBdt: cartSummary.subtotalBdt,
      discountBdt: cartSummary.discountBdt,
      deliveryFeeBdt: cartSummary.deliveryFeeBdt,
      grandTotalBdt: cartSummary.grandTotalBdt,
    };

    setConfirmedOrder(newOrder);
    onCompleteOrder(newOrder);
    setStep('receipt');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-heading"
    >
      <div className="relative w-full max-w-lg bg-[#fafaf7] dark:bg-[#0f1d14] text-stone-900 dark:text-stone-100 h-full flex flex-col shadow-2xl border-l border-stone-200 dark:border-emerald-900/60">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-emerald-900/50 flex items-center justify-between">
          <div>
            <h2 id="drawer-heading" className="text-lg font-bold">
              {step === 'cart' &&
                (language === 'bn'
                  ? `আপনার শপিং ব্যাগ (${cartSummary.totalQuantity})`
                  : `Shopping Bag (${cartSummary.totalQuantity})`)}
              {step === 'checkout' &&
                (language === 'bn'
                  ? 'সিকিউর পেমেন্ট গেটওয়ে ও ডেলিভারি'
                  : 'Integrated Payment Gateway & Delivery')}
              {step === 'receipt' &&
                (language === 'bn' ? 'অর্ডার সফলভাবে সম্পন্ন হয়েছে' : 'Order Confirmed & Verified')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {language === 'bn'
                ? '৳১,৫০০+ অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি'
                : 'Free shipping nationwide on orders over ৳1,500'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'bn' ? 'কার্ট বন্ধ করুন' : 'Close shopping bag'}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'cart' && (
            <>
              {/* Free Delivery Progress Bar */}
              {cartSummary.subtotalBdt > 0 && (
                <div className="p-3.5 rounded-lg bg-emerald-950/5 dark:bg-emerald-900/20 border border-emerald-900/20 dark:border-emerald-500/20 text-xs">
                  {cartSummary.amountToFreeDeliveryBdt === 0 ? (
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                      {language === 'bn'
                        ? 'অভিনন্দন! আপনি সম্পূর্ণ ফ্রি হোম ডেলিভারি পাচ্ছেন।'
                        : 'Unlocked: You qualify for Free Express Home Delivery!'}
                    </p>
                  ) : (
                    <p className="text-stone-700 dark:text-stone-300">
                      {language === 'bn'
                        ? `আর মাত্র ${formatBdtPrice(cartSummary.amountToFreeDeliveryBdt, language)} মূল্যের পণ্য যোগ করলে ফ্রি ডেলিভারি পাবেন।`
                        : `Add ${formatBdtPrice(cartSummary.amountToFreeDeliveryBdt, language)} more to unlock Free Express Delivery.`}
                    </p>
                  )}
                </div>
              )}

              {cartSummary.items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-base font-semibold text-stone-700 dark:text-stone-300">
                    {language === 'bn'
                      ? 'আপনার শপিং ব্যাগ বর্তমানে খালি'
                      : 'Your shopping bag is currently empty'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    {language === 'bn'
                      ? 'সুন্দরবনের মধু, রাজশাহীর আম, ঘরোয়া আচার বা তাজা সবজি ব্যাগে যোগ করুন।'
                      : 'Explore our raw Sundarbans honey, seasonal fruits, artisanal pickles, and fresh farm vegetables.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-stone-200 dark:divide-emerald-900/40">
                  {cartSummary.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId}`}
                      className="py-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {language === 'bn' ? item.product.nameBn : item.product.nameEn}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {language === 'bn' ? item.variant.labelBn : item.variant.labelEn} ·{' '}
                          <span className="tabular-nums">
                            {formatBdtPrice(item.unitPrice, language)}
                          </span>
                        </p>

                        <div className="mt-2.5 inline-flex items-center rounded-md border border-stone-300 dark:border-stone-700">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.variantId, -1)
                            }
                            aria-label={`Decrease quantity of ${item.product.nameEn}`}
                            className="px-2.5 py-1 text-xs font-bold hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.variantId, 1)
                            }
                            aria-label={`Increase quantity of ${item.product.nameEn}`}
                            className="px-2.5 py-1 text-xs font-bold hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold tabular-nums text-emerald-900 dark:text-emerald-300">
                          {formatBdtPrice(item.lineTotal, language)}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.variantId,
                              -item.quantity
                            )
                          }
                          aria-label={`Remove ${item.product.nameEn} from bag`}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'মুছুন' : 'Remove'}</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Promo Code & Division Estimator */}
              {cartSummary.items.length > 0 && (
                <div className="pt-4 border-t border-stone-200 dark:border-emerald-900/40 space-y-4">
                  <div>
                    <label
                      htmlFor="promo-code-input"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      {language === 'bn'
                        ? 'প্রোমো কোড (ব্যবহার করুন: TANZIM10 বা ORGANIC100):'
                        : 'Promo Code (Try TANZIM10 for 10% off):'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-code-input"
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="TANZIM10"
                        className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => onChangePromoCode(promoInput)}
                        className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm pt-2">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>{language === 'bn' ? 'উপমোট (Subtotal):' : 'Subtotal:'}</span>
                      <span className="tabular-nums font-medium">
                        {formatBdtPrice(cartSummary.subtotalBdt, language)}
                      </span>
                    </div>
                    {cartSummary.discountBdt > 0 && (
                      <div className="flex justify-between text-emerald-800 dark:text-emerald-400">
                        <span>
                          {language === 'bn'
                            ? `ছাড় (${cartSummary.appliedPromoCode}):`
                            : `Discount (${cartSummary.appliedPromoCode}):`}
                        </span>
                        <span className="tabular-nums font-semibold">
                          −{formatBdtPrice(cartSummary.discountBdt, language)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>
                        {language === 'bn'
                          ? `ডেলিভারি চার্জ (${activeDivisionObj.nameBn}):`
                          : `Delivery (${activeDivisionObj.nameEn}):`}
                      </span>
                      <span className="tabular-nums font-medium">
                        {cartSummary.deliveryFeeBdt === 0
                          ? language === 'bn'
                            ? 'ফ্রি'
                            : 'FREE'
                          : formatBdtPrice(cartSummary.deliveryFeeBdt, language)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-stone-200 dark:border-emerald-900/50 text-stone-950 dark:text-white">
                      <span>{language === 'bn' ? 'সর্বমোট পরিশোধযোগ্য:' : 'Grand Total:'}</span>
                      <span className="tabular-nums text-emerald-900 dark:text-emerald-300">
                        {formatBdtPrice(cartSummary.grandTotalBdt, language)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="checkout-fullname"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {language === 'bn' ? 'পূর্ণ নাম (Full Name) *' : 'Full Name *'}
                </label>
                <input
                  id="checkout-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'e.g., Tanvir Rahman'}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {language === 'bn' ? 'মোবাইল নম্বর (১১ সংখ্যা) *' : 'Mobile Number (Bangladesh) *'}
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm tabular-nums"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* GEO-Optimized Bangladesh Division & District Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="checkout-division"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {language === 'bn' ? 'বিভাগ (Division) *' : 'Division (GEO Zone) *'}
                  </label>
                  <select
                    id="checkout-division"
                    value={division}
                    onChange={(e) => handleDivisionSelect(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-sm"
                  >
                    {BD_DIVISIONS.map((div) => (
                      <option key={div.id} value={div.id}>
                        {language === 'bn' ? div.nameBn : div.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="checkout-district"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {language === 'bn' ? 'জেলা (District) *' : 'District *'}
                  </label>
                  <select
                    id="checkout-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-sm"
                  >
                    {activeDivisionObj.districts.map((dist) => (
                      <option key={dist.nameEn} value={dist.nameEn}>
                        {language === 'bn' ? dist.nameBn : dist.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'bn' ? activeDivisionObj.etaBn : activeDivisionObj.etaEn}
                </span>
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {language === 'bn' ? 'বিস্তারিত ডেলিভারি ঠিকানা *' : 'Street Address & Landmark *'}
                </label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'বাসা নং, রোড নং, এলাকা, থানা...'
                      : 'House #, Road #, Area / Sector...'
                  }
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-sm"
                />
                {errors.address && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Integrated Payment Gateway Selector */}
              <div className="pt-2">
                <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  {language === 'bn'
                    ? 'পেমেন্ট গেটওয়ে নির্বাচন করুন (Integrated Payment Gateway):'
                    : 'Select Payment Gateway Method:'}
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        id: 'bkash',
                        titleEn: 'bKash Instant Pay',
                        titleBn: 'বিকাশ পেমেন্ট',
                        subEn: 'Tokenized Merchant Gateway',
                        subBn: 'ইন্সট্যান্ট মার্চেন্ট পেমেন্ট',
                      },
                      {
                        id: 'nagad',
                        titleEn: 'Nagad Online',
                        titleBn: 'নগদ পেমেন্ট',
                        subEn: 'Zero-Fee Agro Checkout',
                        subBn: 'দ্রুত ডিজিটাল পেমেন্ট',
                      },
                      {
                        id: 'card',
                        titleEn: 'SSLCommerz Card',
                        titleBn: 'ভিসা / মাস্টারকার্ড',
                        subEn: 'Visa, Mastercard, Nexus',
                        subBn: 'ডেবিট ও ক্রেডিট কার্ড',
                      },
                      {
                        id: 'cod',
                        titleEn: 'Cash on Delivery',
                        titleBn: 'ক্যাশ অন ডেলিভারি',
                        subEn: 'Pay after inspecting harvest',
                        subBn: 'পণ্য হাতে পেয়ে পরিশোধ',
                      },
                    ] as const
                  ).map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-emerald-800 bg-emerald-900/10 dark:border-emerald-400 dark:bg-emerald-400/15'
                            : 'border-stone-300 dark:border-stone-700 hover:border-emerald-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                          {language === 'bn' ? method.titleBn : method.titleEn}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {language === 'bn' ? method.subBn : method.subEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod !== 'cod' && (
                <div className="p-3.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-300 inline-flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      {paymentMethod === 'bkash' && 'bKash Merchant: 01700-TANZIM'}
                      {paymentMethod === 'nagad' && 'Nagad Merchant: 01800-TANZIM'}
                      {paymentMethod === 'card' && 'SSLCommerz 3D-Secure Gateway'}
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {formatBdtPrice(cartSummary.grandTotalBdt, language)}
                    </span>
                  </div>
                  <div>
                    <label
                      htmlFor="gateway-otp-input"
                      className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {language === 'bn'
                        ? 'গেটওয়ে ভেরিফিকেশন কোড / ওটিপি (ডেমো কোড: 4829):'
                        : 'Gateway Verification OTP / Last 4 Digits (Demo: 4829):'}
                    </label>
                    <input
                      id="gateway-otp-input"
                      type="text"
                      value={transactionPinOrRef}
                      onChange={(e) => setTransactionPinOrRef(e.target.value)}
                      className="w-full rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-1.5 text-xs font-mono tracking-widest"
                    />
                    {errors.transactionPinOrRef && (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.transactionPinOrRef}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}

          {step === 'receipt' && confirmedOrder && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-emerald-950/10 dark:bg-emerald-900/25 border border-emerald-800/30 dark:border-emerald-500/30">
                <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold">
                      {language === 'bn'
                        ? `অর্ডার #${confirmedOrder.orderId} নিশ্চিত হয়েছে`
                        : `Order #${confirmedOrder.orderId} Confirmed`}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {confirmedOrder.paymentStatus} · Ref: {confirmedOrder.gatewayRef}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-900/20 dark:border-emerald-500/20 text-xs space-y-1.5">
                  <div>
                    <strong>{language === 'bn' ? 'গ্রাহক:' : 'Customer:'}</strong>{' '}
                    {confirmedOrder.customer.fullName} ({confirmedOrder.customer.phone})
                  </div>
                  <div>
                    <strong>{language === 'bn' ? 'ডেলিভারি অঞ্চল:' : 'Delivery Zone:'}</strong>{' '}
                    {confirmedOrder.customer.district}, {confirmedOrder.customer.division}
                  </div>
                  <div>
                    <strong>{language === 'bn' ? 'ঠিকানা:' : 'Address:'}</strong>{' '}
                    {confirmedOrder.customer.address}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {language === 'bn' ? 'অর্ডারকৃত পণ্যের তালিকা' : 'Order Summary'}
                </h4>
                <ul className="divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                  {confirmedOrder.items.map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between gap-2">
                      <span>
                        {language === 'bn' ? item.nameBn : item.nameEn} (
                        {language === 'bn' ? item.variantLabelBn : item.variantLabelEn}) ×{' '}
                        {item.quantity}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatBdtPrice(item.lineTotal, language)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between text-sm font-bold">
                  <span>{language === 'bn' ? 'সর্বমোট পরিশোধিত/দেয়:' : 'Total Amount:'}</span>
                  <span className="tabular-nums text-emerald-900 dark:text-emerald-300">
                    {formatBdtPrice(confirmedOrder.grandTotalBdt, language)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Drawer Footer Actions */}
        <div className="p-6 border-t border-stone-200 dark:border-emerald-900/50 bg-[#fafaf7] dark:bg-[#0f1d14]">
          {step === 'cart' && cartSummary.items.length > 0 && (
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>
                {language === 'bn'
                  ? `চেকআউট ও পেমেন্টে যান · ${formatBdtPrice(cartSummary.grandTotalBdt, language)}`
                  : `Proceed to Checkout · ${formatBdtPrice(cartSummary.grandTotalBdt, language)}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'checkout' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-200/50 dark:hover:bg-stone-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'bn' ? 'ব্যাগে ফিরুন' : 'Back'}</span>
              </button>
              <button
                type="submit"
                form="checkout-form"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {language === 'bn'
                    ? `অর্ডার নিশ্চিত করুন (${formatBdtPrice(cartSummary.grandTotalBdt, language)})`
                    : `Authorize & Place Order (${formatBdtPrice(cartSummary.grandTotalBdt, language)})`}
                </span>
              </button>
            </div>
          )}

          {step === 'receipt' && (
            <button
              type="button"
              onClick={() => {
                setStep('cart');
                onClose();
              }}
              className="w-full py-3 px-5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white dark:bg-emerald-500 dark:text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
