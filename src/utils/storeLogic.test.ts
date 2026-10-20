import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVariantPrice,
  filterAndSortProducts,
  updateCartItems,
  calculateCartSummary,
  validateCheckoutInput,
  encodeSyncToken,
  decodeSyncToken,
  formatBdtPrice,
  type Product,
  type SyncStatePayload,
} from './storeLogic.ts';

const sampleProducts: Product[] = [
  {
    id: 'honey-khalisha',
    slug: 'sundarbans-khalisha-honey',
    category: 'honey',
    categoryLabelEn: 'Honey',
    categoryLabelBn: 'মধু',
    nameEn: 'Sundarbans Raw Khalisha Honey',
    nameBn: 'সুন্দরবনের খলিশা ফুলের প্রাকৃতিক মধু',
    subtitleEn: 'Unheated wild mangrove nectar',
    subtitleBn: 'অপরিশোধিত প্রাকৃতিক চাকের মধু',
    descriptionEn: 'Harvested by traditional Mouals in Satkhira range.',
    descriptionBn: 'সাতক্ষীরা রেঞ্জের মৌয়ালদের সংগৃহীত খাঁটি মধু।',
    originEn: 'Satkhira, Sundarbans',
    originBn: 'সাতক্ষীরা, সুন্দরবন',
    harvestSeasonEn: 'April – May',
    harvestSeasonBn: 'চৈত্র – বৈশাখ',
    basePriceBdt: 650,
    unitEn: '500g Jar',
    unitBn: '৫০০ গ্রাম জার',
    variants: [
      { id: '250g', labelEn: '250g Glass Jar', labelBn: '২৫০ গ্রাম', multiplier: 0.55 },
      { id: '500g', labelEn: '500g Glass Jar', labelBn: '৫০০ গ্রাম', multiplier: 1 },
      { id: '1kg', labelEn: '1kg Family Jar', labelBn: '১ কেজি', multiplier: 1.9 },
    ],
    rating: 4.9,
    reviewCount: 142,
    inStock: true,
    labCertId: 'BCSIR-HN-2026-09',
    nutritionPer100g: {
      calories: '304 kcal',
      keyNutrientEn: 'Natural Enzymes & Antioxidants',
      keyNutrientBn: 'প্রাকৃতিক এনজাইম ও অ্যান্টিঅক্সিডেন্ট',
    },
    featured: true,
  },
  {
    id: 'pickle-mango-kasundi',
    slug: 'artisanal-mango-kasundi-achar',
    category: 'pickles',
    categoryLabelEn: 'Pickles',
    categoryLabelBn: 'আচার',
    nameEn: 'Traditional Spiced Mango Achar',
    nameBn: 'ঐতিহ্যবাহী কাশ্মীরি ও সরিষা আমের আচার',
    subtitleEn: 'Sun-cured in wood-pressed mustard oil',
    subtitleBn: 'ঘানি ভাঙা সরিষার তেলে রোদে শুকানো আচার',
    descriptionEn: 'Handcrafted heirloom recipe.',
    descriptionBn: 'ঘরোয়া মসলায় তৈরি সুস্বাদু আচার।',
    originEn: 'Bogura',
    originBn: 'বগুড়া',
    harvestSeasonEn: 'Year-round',
    harvestSeasonBn: 'সারা বছর',
    basePriceBdt: 380,
    unitEn: '400g Jar',
    unitBn: '৪০০ গ্রাম জার',
    variants: [
      { id: '400g', labelEn: '400g Jar', labelBn: '৪০০ গ্রাম', multiplier: 1 },
      { id: '800g', labelEn: '800g Jar', labelBn: '৮০০ গ্রাম', multiplier: 1.85 },
    ],
    rating: 4.8,
    reviewCount: 89,
    inStock: true,
    labCertId: 'BSTI-AC-2026-14',
    nutritionPer100g: {
      calories: '210 kcal',
      keyNutrientEn: 'Cold-Pressed Omega-3 Mustard Oil',
      keyNutrientBn: 'ওমেগা-৩ সমৃদ্ধ খাঁটি সরিষার তেল',
    },
    featured: false,
  },
];

test('filterAndSortProducts matches both English and Bangla queries and sorts accurately', () => {
  const byBangla = filterAndSortProducts(sampleProducts, {
    category: 'all',
    searchQuery: 'মধু',
    sortBy: 'featured',
  });
  assert.equal(byBangla.length, 1);
  assert.equal(byBangla[0].id, 'honey-khalisha');

  const sortedByPriceAsc = filterAndSortProducts(sampleProducts, {
    category: 'all',
    searchQuery: '',
    sortBy: 'price-asc',
  });
  assert.equal(sortedByPriceAsc[0].id, 'pickle-mango-kasundi');
  assert.equal(sortedByPriceAsc[1].id, 'honey-khalisha');
});

test('updateCartItems and calculateCartSummary compute variants, promo discounts, and free shipping threshold', () => {
  let cart = updateCartItems([], 'honey-khalisha', '1kg', 1);
  cart = updateCartItems(cart, 'pickle-mango-kasundi', '400g', 1);

  const summary = calculateCartSummary(cart, sampleProducts, 'Dhaka', 'TANZIM10');
  // 1kg honey = round(650 * 1.9) = 1235; 400g achar = 380; subtotal = 1615
  assert.equal(calculateVariantPrice(650, 1.9), 1235);
  assert.equal(summary.subtotalBdt, 1615);
  assert.equal(summary.discountBdt, 162); // 10% of 1615 = 161.5 -> 162
  // discountedSubtotal = 1615 - 162 = 1453 (< 1500 threshold, so Dhaka fee = 60)
  assert.equal(summary.deliveryFeeBdt, 60);
  assert.equal(summary.grandTotalBdt, 1453 + 60);
});

test('validateCheckoutInput enforces Bangladesh phone format and payment gateway verification code', () => {
  const invalidResult = validateCheckoutInput(
    {
      fullName: 'A',
      phone: '12345',
      division: 'Dhaka',
      district: 'Dhaka',
      address: 'Short',
      paymentMethod: 'bkash',
      transactionPinOrRef: '12',
    },
    'en'
  );
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.fullName);
  assert.ok(invalidResult.errors.phone);
  assert.ok(invalidResult.errors.transactionPinOrRef);

  const validResult = validateCheckoutInput(
    {
      fullName: 'Tanvir Ahmed',
      phone: '01712345678',
      division: 'Dhaka',
      district: 'Dhaka',
      address: 'House 14, Road 7, Dhanmondi, Dhaka',
      paymentMethod: 'bkash',
      transactionPinOrRef: '4829',
    },
    'en'
  );
  assert.equal(validResult.valid, true);
});

test('encodeSyncToken and decodeSyncToken preserve multi-device state including Bangla strings', () => {
  const payload: SyncStatePayload = {
    version: 1,
    deviceId: 'DEV-TEST-01',
    updatedAt: 1760000000000,
    language: 'bn',
    darkMode: true,
    cart: [{ productId: 'honey-khalisha', variantId: '500g', quantity: 2 }],
    wishlist: ['pickle-mango-kasundi'],
    orders: [],
    notificationsEnabled: true,
  };

  const token = encodeSyncToken(payload);
  assert.ok(token.startsWith('TAW1:'));
  const decoded = decodeSyncToken(token);
  assert.deepEqual(decoded, payload);
  assert.equal(formatBdtPrice(1250, 'bn'), '৳১,২৫০');
});
