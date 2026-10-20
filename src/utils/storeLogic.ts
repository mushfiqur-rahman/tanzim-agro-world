export type CategoryId = 'all' | 'honey' | 'fruits' | 'pickles' | 'vegetables' | 'organic';

export type Language = 'en' | 'bn';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export type PaymentMethodId = 'bkash' | 'nagad' | 'card' | 'cod';

export interface WeightVariant {
  id: string;
  labelEn: string;
  labelBn: string;
  multiplier: number;
}

export interface Product {
  id: string;
  slug: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabelEn: string;
  categoryLabelBn: string;
  nameEn: string;
  nameBn: string;
  subtitleEn: string;
  subtitleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  originEn: string;
  originBn: string;
  harvestSeasonEn: string;
  harvestSeasonBn: string;
  basePriceBdt: number;
  unitEn: string;
  unitBn: string;
  variants: WeightVariant[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  labCertId: string;
  nutritionPer100g: {
    calories: string;
    keyNutrientEn: string;
    keyNutrientBn: string;
  };
  featured: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface EnrichedCartItem extends CartItem {
  product: Product;
  variant: WeightVariant;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  items: EnrichedCartItem[];
  totalQuantity: number;
  subtotalBdt: number;
  discountBdt: number;
  deliveryFeeBdt: number;
  freeDeliveryThresholdBdt: number;
  amountToFreeDeliveryBdt: number;
  grandTotalBdt: number;
  appliedPromoCode: string | null;
}

export interface CheckoutFormInput {
  fullName: string;
  phone: string;
  division: string;
  district: string;
  address: string;
  paymentMethod: PaymentMethodId;
  transactionPinOrRef?: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CheckoutFormInput, string>>;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    address: string;
  };
  paymentMethod: PaymentMethodId;
  paymentStatus: 'Paid via Gateway' | 'Cash on Delivery Verified';
  gatewayRef: string;
  items: {
    productId: string;
    nameEn: string;
    nameBn: string;
    variantLabelEn: string;
    variantLabelBn: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotalBdt: number;
  discountBdt: number;
  deliveryFeeBdt: number;
  grandTotalBdt: number;
}

export interface SyncStatePayload {
  version: number;
  deviceId: string;
  updatedAt: number;
  language: Language;
  darkMode: boolean;
  cart: CartItem[];
  wishlist: string[];
  orders: OrderRecord[];
  notificationsEnabled: boolean;
}

export const FREE_DELIVERY_THRESHOLD_BDT = 1500;
export const DHAKA_DELIVERY_FEE_BDT = 60;
export const OUTSIDE_DHAKA_DELIVERY_FEE_BDT = 120;

export function calculateVariantPrice(basePriceBdt: number, multiplier: number): number {
  return Math.round(basePriceBdt * multiplier);
}

export function filterAndSortProducts(
  products: Product[],
  options: {
    category: CategoryId;
    searchQuery: string;
    sortBy: SortOption;
  }
): Product[] {
  const query = options.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (options.category !== 'all' && product.category !== options.category) {
      return false;
    }
    if (!query) {
      return true;
    }
    const searchable = [
      product.nameEn,
      product.nameBn,
      product.subtitleEn,
      product.subtitleBn,
      product.categoryLabelEn,
      product.categoryLabelBn,
      product.originEn,
      product.originBn,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(query);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (options.sortBy) {
      case 'price-asc':
        return a.basePriceBdt - b.basePriceBdt;
      case 'price-desc':
        return b.basePriceBdt - a.basePriceBdt;
      case 'rating':
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case 'featured':
      default:
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return b.rating - a.rating;
    }
  });

  return sorted;
}

export function updateCartItems(
  currentCart: CartItem[],
  productId: string,
  variantId: string,
  deltaQuantity: number
): CartItem[] {
  const existingIndex = currentCart.findIndex(
    (item) => item.productId === productId && item.variantId === variantId
  );

  if (existingIndex === -1) {
    if (deltaQuantity <= 0) return [...currentCart];
    return [...currentCart, { productId, variantId, quantity: deltaQuantity }];
  }

  const nextQuantity = currentCart[existingIndex].quantity + deltaQuantity;
  if (nextQuantity <= 0) {
    return currentCart.filter((_, idx) => idx !== existingIndex);
  }

  return currentCart.map((item, idx) =>
    idx === existingIndex ? { ...item, quantity: nextQuantity } : item
  );
}

export function calculateCartSummary(
  cart: CartItem[],
  products: Product[],
  division: string = 'Dhaka',
  promoCode: string = ''
): CartSummary {
  const items: EnrichedCartItem[] = [];

  for (const cartItem of cart) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) continue;

    const variant =
      product.variants.find((v) => v.id === cartItem.variantId) || product.variants[0];
    const unitPrice = calculateVariantPrice(product.basePriceBdt, variant.multiplier);
    const lineTotal = unitPrice * cartItem.quantity;

    items.push({
      ...cartItem,
      product,
      variant,
      unitPrice,
      lineTotal,
    });
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalBdt = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const normalizedPromo = promoCode.trim().toUpperCase();
  let discountBdt = 0;
  let appliedPromoCode: string | null = null;

  if (subtotalBdt > 0) {
    if (normalizedPromo === 'TANZIM10') {
      discountBdt = Math.round(subtotalBdt * 0.1);
      appliedPromoCode = 'TANZIM10';
    } else if (normalizedPromo === 'ORGANIC100' && subtotalBdt >= 500) {
      discountBdt = 100;
      appliedPromoCode = 'ORGANIC100';
    }
  }

  const discountedSubtotal = Math.max(0, subtotalBdt - discountBdt);

  let deliveryFeeBdt = 0;
  if (discountedSubtotal > 0 && discountedSubtotal < FREE_DELIVERY_THRESHOLD_BDT) {
    deliveryFeeBdt =
      division.toLowerCase() === 'dhaka'
        ? DHAKA_DELIVERY_FEE_BDT
        : OUTSIDE_DHAKA_DELIVERY_FEE_BDT;
  }

  const amountToFreeDeliveryBdt =
    discountedSubtotal >= FREE_DELIVERY_THRESHOLD_BDT
      ? 0
      : FREE_DELIVERY_THRESHOLD_BDT - discountedSubtotal;

  const grandTotalBdt =
    discountedSubtotal > 0 ? discountedSubtotal + deliveryFeeBdt : 0;

  return {
    items,
    totalQuantity,
    subtotalBdt,
    discountBdt,
    deliveryFeeBdt,
    freeDeliveryThresholdBdt: FREE_DELIVERY_THRESHOLD_BDT,
    amountToFreeDeliveryBdt,
    grandTotalBdt,
    appliedPromoCode,
  };
}

export function validateCheckoutInput(
  input: CheckoutFormInput,
  language: Language = 'en'
): ValidationResult {
  const errors: Partial<Record<keyof CheckoutFormInput, string>> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName =
      language === 'bn'
        ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন'
        : 'Please enter your full name (at least 2 characters)';
  }

  const cleanedPhone = (input.phone || '').replace(/[\s-]/g, '');
  const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(cleanedPhone)) {
    errors.phone =
      language === 'bn'
        ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
        : 'Enter a valid 11-digit Bangladesh mobile number (e.g., 017XXXXXXXX)';
  }

  if (!input.division || !input.division.trim()) {
    errors.division =
      language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Please select a division';
  }

  if (!input.address || input.address.trim().length < 5) {
    errors.address =
      language === 'bn'
        ? 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন'
        : 'Please provide a complete delivery address';
  }

  if (
    (input.paymentMethod === 'bkash' ||
      input.paymentMethod === 'nagad' ||
      input.paymentMethod === 'card') &&
    (!input.transactionPinOrRef || input.transactionPinOrRef.trim().length < 4)
  ) {
    errors.transactionPinOrRef =
      language === 'bn'
        ? 'পেমেন্ট ওটিপি বা শেষ ৪ সংখ্যা দিন (ন্যূনতম ৪ সংখ্যা)'
        : 'Enter 4+ digit Gateway OTP / Verification Code';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function encodeSyncToken(payload: SyncStatePayload): string {
  const json = JSON.stringify(payload);
  if (typeof Buffer !== 'undefined') {
    return 'TAW1:' + Buffer.from(json, 'utf-8').toString('base64');
  }
  const utf8Bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return 'TAW1:' + btoa(binary);
}

export function decodeSyncToken(token: string): SyncStatePayload | null {
  try {
    const trimmed = token.trim();
    if (!trimmed.startsWith('TAW1:')) return null;
    const base64 = trimmed.slice(5);
    let json = '';
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(base64, 'base64').toString('utf-8');
    } else {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json) as SyncStatePayload;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray(parsed.cart) ||
      !Array.isArray(parsed.wishlist)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function formatBdtPrice(amount: number, language: Language): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-IN');
  if (language === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const converted = formatted.replace(/\d/g, (d) => bnDigits[Number(d)]);
    return `৳${converted}`;
  }
  return `৳${formatted}`;
}
