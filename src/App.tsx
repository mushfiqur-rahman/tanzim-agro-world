/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ShoppingBasket,
  ShoppingCart,
  Sun,
  Moon,
  Globe,
  BellRing,
  RefreshCw,
  User,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  CreditCard,
  Eye,
  Heart,
  Menu,
  X,
  LayoutGrid,
  Compass,
  PackageSearch,
} from 'lucide-react';
import {
  calculateCartSummary,
  calculateVariantPrice,
  filterAndSortProducts,
  formatBdtPrice,
  updateCartItems,
  type CartItem,
  type CategoryId,
  type Language,
  type OrderRecord,
  type Product,
  type SortOption,
  type SyncStatePayload,
} from './utils/storeLogic';
import { CATEGORY_LIST, PRODUCTS } from './data/products';
import { ProductIllustration } from './components/ProductIllustration';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import {
  SyncAndNotificationModal,
  type AppNotificationItem,
} from './components/SyncAndNotificationModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'tanzim_agro_state_v1';
const BROADCAST_CHANNEL_NAME = 'tanzim_agro_sync_v1';

type NavSectionId =
  | 'home'
  | 'shop'
  | 'deals'
  | 'featured'
  | 'bestsell'
  | 'honey'
  | 'fruits'
  | 'pickles'
  | 'vegetables'
  | 'organic';

function createInitialDeviceId(): string {
  return 'TAW-DEV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getPriceRangeText(product: Product, language: Language): string {
  const prices = product.variants.map((v) =>
    calculateVariantPrice(product.basePriceBdt, v.multiplier)
  );
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (language === 'bn') {
    return `${formatBdtPrice(minPrice, 'bn')} – ${formatBdtPrice(maxPrice, 'bn')}`;
  }
  return `${minPrice.toLocaleString('en-IN')}৳ – ${maxPrice.toLocaleString('en-IN')}৳`;
}

export default function App() {
  const [deviceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tanzim_agro_device_id');
      if (saved) return saved;
      const generated = createInitialDeviceId();
      localStorage.setItem('tanzim_agro_device_id', generated);
      return generated;
    } catch {
      return 'TAW-DEV-LOCAL';
    }
  });

  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [activeNav, setActiveNav] = useState<NavSectionId>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 'honey-khalisha', variantId: '500g', quantity: 1 },
  ]);
  const [wishlist, setWishlist] = useState<string[]>(['pickle-mango-kasundi']);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [division, setDivision] = useState<string>('Dhaka');
  const [promoCode, setPromoCode] = useState<string>('');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [mobileMenuTab, setMobileMenuTab] = useState<'menu' | 'categories'>('menu');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [featuredPage, setFeaturedPage] = useState<number>(0);
  const [bestSellPage, setBestSellPage] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<{
    titleEn: string;
    titleBn: string;
    bodyEn: string;
    bodyBn: string;
  } | null>(null);

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<AppNotificationItem[]>([
    {
      id: 'notif-1',
      titleEn: 'Fresh Sundarbans Khalisha Honey Batch Arrived',
      titleBn: 'সুন্দরবনের নতুন খলিশা মধুর ব্যাচ এসেছে',
      bodyEn: 'Lab-certified raw Satkhira range harvest (BCSIR-HN-2026-091) is now ready for dispatch.',
      bodyBn: 'সাতক্ষীরা রেঞ্জের ল্যাব টেস্টেড প্রাকৃতিক মধু এখন ডেলিভারির জন্য প্রস্তুত।',
      timestamp: 'Just now',
    },
    {
      id: 'notif-2',
      titleEn: 'Dawn Savar Organic Vegetable Harvest Complete',
      titleBn: 'সাভারের ভোরের তাজা অর্গানিক সবজি সংগৃহীত',
      bodyEn: 'Pesticide-free cucumber, green chili, onion, and garlic packed at 5:00 AM.',
      bodyBn: 'কীটনাশক মুক্ত শসা, কাঁচামরিচ, পেঁয়াজ ও রসুন ভোর ৫টায় প্যাকিং সম্পন্ন হয়েছে।',
      timestamp: 'Today · 05:30 AM',
    },
  ]);

  // Close desktop category mega-dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SyncStatePayload>;
        if (parsed.language === 'en' || parsed.language === 'bn') {
          setLanguage(parsed.language);
        }
        if (typeof parsed.darkMode === 'boolean') {
          setDarkMode(parsed.darkMode);
        }
        if (Array.isArray(parsed.cart)) {
          setCart(parsed.cart);
        }
        if (Array.isArray(parsed.wishlist)) {
          setWishlist(parsed.wishlist);
        }
        if (Array.isArray(parsed.orders)) {
          setOrders(parsed.orders);
        }
      }
    } catch {
      // Fallback to defaults if storage is restricted
    }
  }, []);

  // Apply Dark Mode class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Update document lang attribute for screen readers
  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  }, [language]);

  const syncPayload: SyncStatePayload = useMemo(
    () => ({
      version: 1,
      deviceId,
      updatedAt: Date.now(),
      language,
      darkMode,
      cart,
      wishlist,
      orders,
      notificationsEnabled: true,
    }),
    [deviceId, language, darkMode, cart, wishlist, orders]
  );

  // Persist to localStorage & broadcast across tabs/devices via BroadcastChannel
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncPayload));
      setLastSyncedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch {
      // Ignore storage quota errors
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage(syncPayload);
        return () => channel.close();
      } catch {
        // Ignore if BroadcastChannel is unsupported
      }
    }
  }, [syncPayload]);

  // Listen for incoming BroadcastChannel or storage updates from other tabs
  useEffect(() => {
    const applyIncomingState = (incoming: SyncStatePayload) => {
      if (!incoming || incoming.deviceId === deviceId) return;
      setLanguage(incoming.language);
      setDarkMode(incoming.darkMode);
      setCart(incoming.cart);
      setWishlist(incoming.wishlist);
      setOrders(incoming.orders);
      setLastSyncedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.onmessage = (event) => {
          applyIncomingState(event.data as SyncStatePayload);
        };
      } catch {
        channel = null;
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          applyIncomingState(JSON.parse(e.newValue) as SyncStatePayload);
        } catch {
          // Ignore malformed JSON
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [deviceId]);

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(PRODUCTS, {
        category: selectedCategory,
        searchQuery,
        sortBy,
      }) as (Product & { discountPercent: number; imageUrl: string })[],
    [selectedCategory, searchQuery, sortBy]
  );

  const featuredProductsList = useMemo(() => {
    if (featuredPage === 0) {
      return PRODUCTS.slice(0, 5);
    }
    return PRODUCTS.slice(5, 10);
  }, [featuredPage]);

  const bestSellProductsList = useMemo(() => {
    if (bestSellPage === 0) {
      return [
        PRODUCTS[12], // Pure Pabna Cow Gawa Ghee
        PRODUCTS[7],  // Organic Cucumber
        PRODUCTS[8],  // Fresh Green Chili
        PRODUCTS[0],  // Sundarbans Raw Honey
        PRODUCTS[4],  // Artisanal Mango Achar
      ];
    }
    return PRODUCTS.slice(9, 14);
  }, [bestSellPage]);

  const discountedHorizontalProducts = useMemo(
    () => [
      PRODUCTS[0],  // Sundarbans Raw Honey
      PRODUCTS[12], // Pure Gawa Ghee
      PRODUCTS[4],  // Kashmiri Mango Achar
      PRODUCTS[2],  // Rajshahi Himsagar Mango
      PRODUCTS[7],  // Organic Cucumber
      PRODUCTS[8],  // Fresh Green Chili
    ],
    []
  );

  const cartSummary = useMemo(
    () => calculateCartSummary(cart, PRODUCTS, division, promoCode),
    [cart, division, promoCode]
  );

  const handleAddToCart = (productId: string, variantId?: string, quantity: number = 1) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const resolvedVariantId =
      variantId || product.variants[1]?.id || product.variants[0].id;
    setCart((prev) => updateCartItems(prev, productId, resolvedVariantId, quantity));
    setRecentlyAddedId(productId);
    setTimeout(() => {
      setRecentlyAddedId((current) => (current === productId ? null : current));
    }, 1200);
  };

  const handleBuyNow = (productId: string, variantId: string, quantity: number) => {
    handleAddToCart(productId, variantId, quantity);
    setActiveProductModal(null);
    setIsCartOpen(true);
  };

  const triggerPushNotification = async (
    customTitleEn?: string,
    customTitleBn?: string,
    customBodyEn?: string,
    customBodyBn?: string
  ) => {
    const titleEn =
      customTitleEn || 'Tanzim Agro Harvest Alert: 10% Off Pure Honey & Achar';
    const titleBn =
      customTitleBn || 'তানজিম এগ্রো অ্যালার্ট: খাঁটি মধু ও আচারে ১০% ছাড় (TANZIM10)';
    const bodyEn =
      customBodyEn ||
      'Use code TANZIM10 at checkout. Multi-device cart state is synced and ready.';
    const bodyBn =
      customBodyBn ||
      'চেকআউটে TANZIM10 কোড ব্যবহার করুন। আপনার কার্ট সকল ডিভাইসে সিঙ্ক করা হয়েছে।';

    const newEntry: AppNotificationItem = {
      id: 'notif-' + Date.now(),
      titleEn,
      titleBn,
      bodyEn,
      bodyBn,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications((prev) => [newEntry, ...prev]);
    setLiveToast({ titleEn, titleBn, bodyEn, bodyBn });
    setTimeout(() => setLiveToast(null), 5000);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(language === 'bn' ? titleBn : titleEn, {
            body: language === 'bn' ? bodyBn : bodyEn,
            icon: '/icon.svg',
          });
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(language === 'bn' ? titleBn : titleEn, {
              body: language === 'bn' ? bodyBn : bodyEn,
              icon: '/icon.svg',
            });
          }
        }
      } catch {
        // Fallback toast already displayed
      }
    }
  };

  const handleCompleteOrder = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    triggerPushNotification(
      `Order #${newOrder.orderId} Dispatched to Packaging`,
      `অর্ডার #${newOrder.orderId} সফলভাবে গ্রহণ করা হয়েছে`,
      `Payment (${newOrder.paymentStatus}) verified. Preparing organic harvest for ${newOrder.customer.district}.`,
      `পেমেন্ট যাচাই সম্পন্ন। ${newOrder.customer.district}-এ দ্রুত ডেলিভারির জন্য প্যাকিং চলছে।`
    );
  };

  const handleImportSyncPayload = (payload: SyncStatePayload) => {
    setLanguage(payload.language);
    setDarkMode(payload.darkMode);
    setCart(payload.cart);
    setWishlist(payload.wishlist);
    setOrders(payload.orders);
  };

  const selectCategoryAndScroll = (catId: CategoryId, navId?: NavSectionId) => {
    setSelectedCategory(catId);
    setActiveNav(navId || (catId === 'all' ? 'shop' : catId));
    setIsCategoryDropdownOpen(false);
    setIsMobileMenuOpen(false);
    const el = document.getElementById('recent-products');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string, navId: NavSectionId, resetCategory?: boolean) => {
    if (resetCategory) {
      setSelectedCategory('all');
    }
    setActiveNav(navId);
    setIsCategoryDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const primaryNavItems: {
    id: NavSectionId;
    labelEn: string;
    labelBn: string;
    href: string;
    onClick: () => void;
    desktopVisible: boolean;
  }[] = [
    {
      id: 'home',
      labelEn: 'Home',
      labelBn: 'হোম',
      href: '#top',
      onClick: () => navigateToSection('top', 'home', true),
      desktopVisible: true,
    },
    {
      id: 'shop',
      labelEn: 'Shop',
      labelBn: 'শপ',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('all', 'shop'),
      desktopVisible: true,
    },
    {
      id: 'deals',
      labelEn: 'Offers',
      labelBn: 'অফার',
      href: '#discount-section',
      onClick: () => navigateToSection('discount-section', 'deals'),
      desktopVisible: true,
    },
    {
      id: 'honey',
      labelEn: 'Honey (মধু)',
      labelBn: 'মধু (Honey)',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('honey', 'honey'),
      desktopVisible: true,
    },
    {
      id: 'fruits',
      labelEn: 'Fruits (ফল)',
      labelBn: 'ফল (Fruits)',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('fruits', 'fruits'),
      desktopVisible: true,
    },
    {
      id: 'pickles',
      labelEn: 'Pickles (আচার)',
      labelBn: 'আচার (Pickles)',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('pickles', 'pickles'),
      desktopVisible: true,
    },
    {
      id: 'vegetables',
      labelEn: 'Vegetables (সবজি)',
      labelBn: 'সবজি (Veg)',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('vegetables', 'vegetables'),
      desktopVisible: true,
    },
    {
      id: 'organic',
      labelEn: 'Organic',
      labelBn: 'অর্গানিক',
      href: '#recent-products',
      onClick: () => selectCategoryAndScroll('organic', 'organic'),
      desktopVisible: true,
    },
    {
      id: 'featured',
      labelEn: 'New Arrival',
      labelBn: 'নতুন পণ্য',
      href: '#featured-products',
      onClick: () => navigateToSection('featured-products', 'featured'),
      desktopVisible: false,
    },
    {
      id: 'bestsell',
      labelEn: 'Best Sellers',
      labelBn: 'জনপ্রিয় পণ্য',
      href: '#bestsell-section',
      onClick: () => navigateToSection('bestsell-section', 'bestsell'),
      desktopVisible: false,
    },
  ];

  const categoryMenuCards = [
    {
      id: 'honey' as CategoryId,
      navId: 'honey' as NavSectionId,
      tileId: 'tile-honey',
      labelEn: 'Pure Sundarbans Honey (মধু)',
      labelBn: 'সুন্দরবন ও কালোজিরা মধু',
      subEn: 'Khalisha, Kalojira & Black Forest',
      subBn: 'খলিশা, কালোজিরা ও প্রাকৃতিক চাকের মধু',
    },
    {
      id: 'fruits' as CategoryId,
      navId: 'fruits' as NavSectionId,
      tileId: 'tile-fruits',
      labelEn: 'Seasonal Fruits & Dates (ফল)',
      labelBn: 'মৌসুমি ফল ও খেজুর',
      subEn: 'Himsagar Mango, Litchi & Kalmi Dates',
      subBn: 'হিমসাগর আম, বেদানা লিচু ও কলমি খেজুর',
    },
    {
      id: 'pickles' as CategoryId,
      navId: 'pickles' as NavSectionId,
      tileId: 'tile-pickles',
      labelEn: 'Artisanal Pickles / Achar (আচার)',
      labelBn: 'ঐতিহ্যবাহী ঘরোয়া আচার',
      subEn: 'Kashmiri Mango, Garlic & Naga Chili',
      subBn: 'কাশ্মীরি আম, রসুন ও নাগা মরিচের আচার',
    },
    {
      id: 'vegetables' as CategoryId,
      navId: 'vegetables' as NavSectionId,
      tileId: 'tile-vegetables',
      labelEn: 'Fresh Organic Vegetables (সবজি)',
      labelBn: 'তাজা অর্গানিক সবজি ও মসলা',
      subEn: 'Cucumber, Chili, Onion, Garlic & Ginger',
      subBn: 'শসা, কাঁচামরিচ, পেঁয়াজ, রসুন ও আদা',
    },
    {
      id: 'organic' as CategoryId,
      navId: 'organic' as NavSectionId,
      tileId: 'tile-mustard-oil',
      labelEn: 'Ghee, Mustard Oil & Gur (অর্গানিক)',
      labelBn: 'গাওয়া ঘি, সরিষার তেল ও গুড়',
      subEn: 'Pabna Gawa Ghee, Ghani Oil & Patali Gur',
      subBn: 'পাবনার ঘি, ঘানি ভাঙা তেল ও খেজুরের গুড়',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-stone-900 dark:bg-[#0b140e] dark:text-stone-100 overflow-x-hidden"
      x-data="{ store: 'tanzimagroworld.com', template: 'ecomart', responsiveNavbar: true }"
    >
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#097F00] focus:text-white focus:font-semibold"
      >
        {language === 'bn' ? 'মূল কন্টেন্টে যান' : 'Skip to content'}
      </a>

      {/* =====================================================================
          RESPONSIVE NAVBAR (ZERO HORIZONTAL SCROLL ON ALL DEVICES)
          - Mobile/Tablet (< lg): Compact 56px sticky top navbar with Hamburger
            toggler, Brand Logo, Language, Theme, and Cart. Clicking the toggler
            expands the responsive vertical Navbar Collapse panel directly below.
          - Desktop (lg+): Full EcoMart Two-Tier Sticky Header + Green Navbar
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0e1b12] shadow-xs border-b border-stone-200 lg:border-b-0 dark:border-emerald-900/50">
        {/* ROW 1: Brand, Navbar Toggler (Mobile/Tablet), Desktop Search & Utility Controls */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 lg:h-auto lg:py-3 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Mobile/Tablet Navbar Toggler + Brand Lockup */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileMenuTab('menu');
                setIsMobileMenuOpen((prev) => !prev);
              }}
              aria-label={
                isMobileMenuOpen
                  ? language === 'bn'
                    ? 'নেভিগেশন মেনু বন্ধ করুন'
                    : 'Close navigation menu'
                  : language === 'bn'
                    ? 'নেভিগেশন মেনু খুলুন'
                    : 'Open navigation menu'
              }
              aria-expanded={isMobileMenuOpen}
              aria-controls="responsive-navbar-collapse"
              className="lg:hidden min-h-[44px] min-w-[40px] sm:min-w-[44px] -ml-1 rounded-md flex items-center justify-center text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#172b1e] transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#097F00] dark:text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#097F00] dark:text-emerald-400" />
              )}
            </button>

            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                navigateToSection('top', 'home', true);
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#097F00] flex items-center justify-center text-white shadow-xs">
                <svg viewBox="0 0 32 32" className="w-4 h-4 sm:w-6 sm:h-6 fill-current">
                  <path d="M10 10V8a6 6 0 0112 0v2h4a1 1 0 011 1v15a3 3 0 01-3 3H8a3 3 0 01-3-3V11a1 1 0 011-1h4zm2 0h8V8a4 4 0 00-8 0v2zm4 12c3.5 0 6-2.5 6-6-3.5 0-6 2.5-6 6zm0 0c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" />
                </svg>
              </div>
              <div>
                <div className="text-sm sm:text-xl font-extrabold tracking-tight text-[#097F00] dark:text-[#4ade80] leading-none whitespace-nowrap">
                  {language === 'bn' ? 'তানজিম এগ্রো' : 'TANZIM AGRO'}
                </div>
                <div className="text-[7px] sm:text-[9px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] text-[#15803d] dark:text-emerald-300/80 uppercase mt-0.5 whitespace-nowrap">
                  {language === 'bn' ? 'মধু • ফল • আচার • সবজি' : 'FRESH • PURE • NATURAL'}
                </div>
              </div>
            </a>
          </div>

          {/* Center: Desktop Compound Search Bar with Category Dropdown */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const el = document.getElementById('recent-products');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden lg:flex w-full max-w-xl items-stretch border border-stone-300 dark:border-emerald-800/80 rounded-xs overflow-hidden bg-white dark:bg-[#132419]"
          >
            <label htmlFor="header-cat-select" className="sr-only">
              {language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select Category'}
            </label>
            <select
              id="header-cat-select"
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value as CategoryId;
                selectCategoryAndScroll(val);
              }}
              className="px-3 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-[#172b1e] border-r border-stone-300 dark:border-emerald-800/80 shrink-0 cursor-pointer"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {language === 'bn' ? cat.labelBn : cat.labelEn}
                </option>
              ))}
            </select>

            <label htmlFor="header-search-input" className="sr-only">
              {language === 'bn' ? 'পণ্য খুঁজুন' : 'Search Products'}
            </label>
            <input
              id="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'মধু, ফল, আচার বা সবজি খুঁজুন...'
                  : 'Search Products...'
              }
              className="flex-1 min-w-0 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none"
            />

            <button
              type="submit"
              aria-label={language === 'bn' ? 'পণ্য অনুসন্ধান করুন' : 'Search products'}
              className="px-4 bg-[#097F00] hover:bg-[#076300] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right: Bilingual Switch, Dark Mode, Sync/Push, PWA & EcoMart Basket */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher (English / বাংলা) */}
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center p-0.5 rounded-md bg-stone-100 dark:bg-[#172b1e] border border-stone-200 dark:border-emerald-800/70"
            >
              <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-[#097F00] dark:text-emerald-400 hidden sm:inline" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-[#097F00] text-white'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">English</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold font-bangla transition-colors cursor-pointer whitespace-nowrap ${
                  language === 'bn'
                    ? 'bg-[#097F00] text-white'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Dark / Light Theme Switcher */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={
                darkMode
                  ? language === 'bn'
                    ? 'লাইট মোড'
                    : 'Switch to Light Mode'
                  : language === 'bn'
                    ? 'ডার্ক মোড'
                    : 'Switch to Dark Mode'
              }
              className="inline-flex items-center justify-center gap-1 min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] sm:px-2.5 sm:py-1.5 rounded-md border border-stone-200 dark:border-emerald-800/70 bg-stone-50 dark:bg-[#172b1e] text-stone-800 dark:text-stone-200 text-xs font-semibold hover:border-[#097F00] transition-colors cursor-pointer whitespace-nowrap"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">
                    {language === 'bn' ? 'লাইট' : 'Light'}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#097F00]" />
                  <span className="hidden xl:inline">
                    {language === 'bn' ? 'ডার্ক' : 'Dark'}
                  </span>
                </>
              )}
            </button>

            {/* Sync & Push Alerts Button */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              aria-label={language === 'bn' ? 'সিঙ্ক ও নোটিফিকেশন' : 'Sync & Push Alerts'}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-stone-200 dark:border-emerald-800/70 bg-stone-50 dark:bg-[#172b1e] text-stone-800 dark:text-stone-200 text-xs font-semibold hover:border-[#097F00] transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#097F00] dark:text-emerald-400" />
              <span className="hidden xl:inline">
                {language === 'bn' ? 'সিঙ্ক' : 'Sync'}
              </span>
            </button>

            <div className="hidden 2xl:block">
              <PWAInstallButton language={language} />
            </div>

            {/* EcoMart Account Icon */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              aria-label="Account & Device Sync Profile"
              className="hidden md:inline-flex p-1.5 text-stone-800 dark:text-stone-200 hover:text-[#097F00] transition-colors cursor-pointer"
            >
              <User className="w-5 h-5" />
            </button>

            {/* EcoMart Signature Shopping Basket + Badge + Price */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={
                language === 'bn'
                  ? `শপিং ব্যাগ খুলুন, ${cartSummary.totalQuantity} টি পণ্য`
                  : `Open Shopping Bag, ${cartSummary.totalQuantity} items`
              }
              className="inline-flex items-center gap-1 sm:gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-[#172b1e] transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="relative">
                <ShoppingBasket className="w-5 h-5 sm:w-6 sm:h-6 text-stone-900 dark:text-stone-100" />
                <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-[#097F00] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartSummary.totalQuantity}
                </span>
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-stone-900 dark:text-stone-100 tabular-nums ml-1">
                {formatBdtPrice(cartSummary.grandTotalBdt, language)}
              </span>
            </button>
          </div>
        </div>

        {/* ROW 2 (Desktop lg+): Full-Width EcoMart Solid Green Navbar (#097F00) — NO HORIZONTAL SCROLL */}
        <div className="hidden lg:block bg-[#097F00] dark:bg-[#076100] text-white border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 xl:gap-4">
            <div className="flex items-center gap-2 xl:gap-4 min-w-0 flex-1">
              {/* Interactive "All Categories" Mega-Menu Dropdown Trigger */}
              <div ref={categoryDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  aria-expanded={isCategoryDropdownOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#076300] hover:bg-[#054f00] text-white text-xs font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LayoutGrid className="w-4 h-4 text-lime-300" />
                  <span>
                    {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isCategoryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Category Mega-Dropdown Panel */}
                {isCategoryDropdownOpen && (
                  <div
                    role="menu"
                    aria-label={language === 'bn' ? 'ক্যাটাগরি তালিকা' : 'Product Categories'}
                    className="absolute left-0 top-full mt-1 w-80 rounded-md bg-white dark:bg-[#102016] text-stone-900 dark:text-stone-100 shadow-xl border border-stone-200 dark:border-emerald-800/80 py-2 z-50"
                  >
                    {categoryMenuCards.map((item) => {
                      const isSelected = selectedCategory === item.id;
                      return (
                        <button
                          key={item.id}
                          role="menuitem"
                          type="button"
                          onClick={() => selectCategoryAndScroll(item.id, item.navId)}
                          className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-[#f5fbf4] dark:hover:bg-[#183021] transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#f5fbf4] dark:bg-[#183021]' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xs overflow-hidden bg-[#d9e7cb] shrink-0 border border-stone-200 dark:border-emerald-800">
                            <ProductIllustration
                              productId={item.tileId}
                              category="category-tile"
                              title={language === 'bn' ? item.labelBn : item.labelEn}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                              {language === 'bn' ? item.labelBn : item.labelEn}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {language === 'bn' ? item.subBn : item.subEn}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#097F00] dark:text-emerald-400 shrink-0" />
                        </button>
                      );
                    })}
                    <div className="mt-1 pt-2 px-3.5 border-t border-stone-100 dark:border-emerald-900/60">
                      <button
                        type="button"
                        onClick={() => selectCategoryAndScroll('all', 'shop')}
                        className="w-full py-1.5 rounded-xs bg-[#097F00] hover:bg-[#076300] text-white text-xs font-bold text-center cursor-pointer"
                      >
                        {language === 'bn'
                          ? `সকল পণ্য দেখুন (${PRODUCTS.length})`
                          : `View All Products (${PRODUCTS.length})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Semantic Primary Navbar Links (Zero horizontal scroll, fits 1024px+ cleanly) */}
              <nav aria-label="Main Store Navigation" className="min-w-0 flex-1">
                <ul className="flex flex-wrap items-center gap-0.5 xl:gap-1.5 py-1.5 text-xs font-semibold">
                  {primaryNavItems
                    .filter((item) => item.desktopVisible)
                    .map((item) => {
                      const isActive = activeNav === item.id;
                      return (
                        <li key={item.id} className="shrink-0">
                          <a
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              item.onClick();
                            }}
                            className={`inline-block px-2 xl:px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap ${
                              isActive
                                ? 'bg-white/20 text-white font-bold shadow-2xs'
                                : 'text-white/95 hover:bg-white/10 hover:text-lime-200'
                            }`}
                          >
                            {language === 'bn' ? item.labelBn : item.labelEn}
                          </a>
                        </li>
                      );
                    })}
                </ul>
              </nav>
            </div>

            {/* Right: EcoMart TRACK ORDER Button */}
            <button
              type="button"
              onClick={() => setIsTrackOrderOpen(true)}
              className="px-3.5 py-1.5 my-1 rounded-xs bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              {language === 'bn' ? 'অর্ডার ট্র্যাক' : 'TRACK ORDER'}
            </button>
          </div>
        </div>

        {/* =====================================================================
            RESPONSIVE COLLAPSIBLE NAVBAR MENU FOR MOBILE & TABLET (< lg)
            Expands vertically directly inside the navbar when Hamburger is clicked.
            Zero horizontal scroll!
           ===================================================================== */}
        {isMobileMenuOpen && (
          <div
            id="responsive-navbar-collapse"
            role="region"
            aria-label={language === 'bn' ? 'রেসপনসিভ নেভিগেশন মেনু' : 'Responsive Navigation Menu'}
            className="lg:hidden border-t border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#0e1b12] shadow-xl max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            {/* Two Interactive Navbar Tabs: Main Menu | Categories */}
            <div
              role="tablist"
              className="grid grid-cols-2 border-b border-stone-200 dark:border-emerald-900/60 bg-stone-100 dark:bg-[#14261a]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileMenuTab === 'menu'}
                onClick={() => setMobileMenuTab('menu')}
                className={`min-h-[44px] px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  mobileMenuTab === 'menu'
                    ? 'border-[#097F00] text-[#097F00] dark:text-emerald-400 bg-white dark:bg-[#0e1b12]'
                    : 'border-transparent text-stone-600 dark:text-stone-400'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>{language === 'bn' ? 'মূল মেনু' : 'Main Menu'}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileMenuTab === 'categories'}
                onClick={() => setMobileMenuTab('categories')}
                className={`min-h-[44px] px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  mobileMenuTab === 'categories'
                    ? 'border-[#097F00] text-[#097F00] dark:text-emerald-400 bg-white dark:bg-[#0e1b12]'
                    : 'border-transparent text-stone-600 dark:text-stone-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
              </button>
            </div>

            {mobileMenuTab === 'menu' ? (
              <nav aria-label="Mobile & Tablet Navbar Links" className="p-3 sm:p-4">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {primaryNavItems.map((item) => {
                    const isActive = activeNav === item.id;
                    return (
                      <li key={`nav-collapse-${item.id}`}>
                        <a
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            item.onClick();
                          }}
                          className={`min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-[#097F00] text-white'
                              : 'bg-stone-50 dark:bg-[#14261a] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1a3122]'
                          }`}
                        >
                          <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                          <ChevronRight className="w-4 h-4 opacity-75" />
                        </a>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 pt-3 border-t border-stone-200 dark:border-emerald-900/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsTrackOrderOpen(true);
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md bg-[#16a34a] text-white text-xs font-bold flex items-center justify-between cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <PackageSearch className="w-4 h-4" />
                      {language === 'bn'
                        ? 'অর্ডার ট্র্যাক করুন (Track Order)'
                        : 'Track Your Order'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSyncModalOpen(true);
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-stone-200 dark:border-emerald-800/80 bg-stone-50 dark:bg-[#15281c] text-stone-800 dark:text-stone-100 text-xs font-bold flex items-center justify-between cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#097F00] dark:text-emerald-400" />
                      {language === 'bn'
                        ? 'মাল্টি-ডিভাইস সিঙ্ক ও নোটিফিকেশন'
                        : 'Multi-Device Sync & Push Alerts'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </nav>
            ) : (
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryMenuCards.map((item) => (
                  <button
                    key={`mob-cat-${item.id}`}
                    type="button"
                    onClick={() => selectCategoryAndScroll(item.id, item.navId)}
                    className="w-full min-h-[56px] p-2.5 rounded-md border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#14261a] hover:border-[#097F00] flex items-center gap-3 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xs overflow-hidden bg-[#d9e7cb] shrink-0">
                      <ProductIllustration
                        productId={item.tileId}
                        category="category-tile"
                        title={language === 'bn' ? item.labelBn : item.labelEn}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {language === 'bn' ? item.labelBn : item.labelEn}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {language === 'bn' ? item.subBn : item.subEn}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#097F00] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div className="px-4 py-3 border-t border-stone-200 dark:border-emerald-900/60 bg-stone-50 dark:bg-[#0b150e] flex flex-wrap items-center justify-between gap-2">
              <PWAInstallButton language={language} />
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <a
                  href="tel:01757876606"
                  className="text-stone-700 dark:text-stone-300 hover:text-[#097F00]"
                >
                  01757876606
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61579066244450"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#097F00] dark:text-emerald-400 hover:underline"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MOBILE & TABLET (< lg) SEARCH BAR (NO HORIZONTAL SCROLL)
         ===================================================================== */}
      <div className="lg:hidden bg-[#f5fbf4] dark:bg-[#101f15] border-b border-stone-200 dark:border-emerald-900/50 px-3 sm:px-6 py-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const el = document.getElementById('recent-products');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-stretch border border-stone-300 dark:border-emerald-800 rounded-md overflow-hidden bg-white dark:bg-[#132419]"
        >
          <select
            aria-label={language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
            value={selectedCategory}
            onChange={(e) => selectCategoryAndScroll(e.target.value as CategoryId)}
            className="px-2.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-[#172b1e] border-r border-stone-300 dark:border-emerald-800 shrink-0"
          >
            {CATEGORY_LIST.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {language === 'bn' ? cat.labelBn : cat.labelEn}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'মধু, ফল, আচার বা সবজি খুঁজুন...'
                : 'Search honey, fruits, achar...'
            }
            className="flex-1 min-w-0 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            aria-label={language === 'bn' ? 'অনুসন্ধান' : 'Search'}
            className="px-3.5 bg-[#097F00] text-white flex items-center justify-center shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Live Push Notification Toast */}
      {liveToast && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed top-28 right-6 z-50 max-w-sm rounded-xl bg-emerald-950 text-white border border-emerald-400/40 p-4 shadow-xl flex items-start gap-3"
        >
          <BellRing className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold">
              {language === 'bn' ? liveToast.titleBn : liveToast.titleEn}
            </div>
            <p className="text-emerald-100/90">
              {language === 'bn' ? liveToast.bodyBn : liveToast.bodyEn}
            </p>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1 bg-white dark:bg-[#0b140e]">
        {/* =====================================================================
            SECTION 1: ECOMART HERO BANNER + 6-COLUMN REAL PHOTO CATEGORY STRIP
           ===================================================================== */}
        <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">
          <div className="rounded-md overflow-hidden bg-gradient-to-r from-[#053b06] via-[#075708] to-[#053b06] text-white shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Hero Copy matching ecomart.borbila.net */}
              <div className="lg:col-span-6 p-6 sm:p-10 lg:pl-12 lg:pr-6 flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#22c55e]/25 border border-[#4ade80]/50 flex items-center justify-center">
                    <ShoppingBasket className="w-4 h-4 text-[#86efac]" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold tracking-wide text-white leading-none">
                      {language === 'bn' ? 'তানজিম এগ্রো ওয়ার্ল্ড' : 'TANZIM AGRO'}
                    </div>
                    <div className="text-[9px] font-semibold tracking-[0.18em] text-[#86efac] uppercase mt-0.5">
                      FRESH • PURE • NATURAL
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                  {language === 'bn' ? 'খাঁটি ও তাজা পণ্য,' : 'Fresh Choices,'}
                  <span className="block mt-1 font-serif italic font-semibold text-[#84cc16] text-2xl sm:text-4xl">
                    {language === 'bn' ? 'সুস্থ ও সুন্দর জীবন' : 'Better Living'}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-emerald-50/95 max-w-lg leading-relaxed">
                  {language === 'bn' ? (
                    <>
                      সুন্দরবনের প্রাকৃতিক <strong>মধু</strong>, বাগানের গাছপাকা <strong>ফল</strong>, ঐতিহ্যবাহী ঘরোয়া <strong>আচার</strong> এবং ভোরের তাজা অর্গানিক <strong>সবজি</strong>{' '}
                      <span className="text-[#a3e635] font-semibold">
                        সরাসরি আপনার দরজায় পৌঁছে দিচ্ছি।
                      </span>
                    </>
                  ) : (
                    <>
                      Handpicked Sundarbans honey (মধু), seasonal fruits (ফল), artisanal achar (আচার), and daily organic vegetables (সবজি){' '}
                      <span className="text-[#a3e635] font-semibold">
                        delivered to your door.
                      </span>
                    </>
                  )}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-5">
                  <a
                    href="#recent-products"
                    onClick={(e) => {
                      e.preventDefault();
                      selectCategoryAndScroll('all', 'shop');
                    }}
                    className="inline-flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-gradient-to-r from-[#097F00] via-[#16a34a] to-[#4ade80] hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition-opacity"
                  >
                    <span>{language === 'bn' ? 'এখনই কিনুন' : 'SHOP NOW'}</span>
                    <span className="w-8 h-8 rounded-full bg-white text-[#097F00] flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </a>

                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm italic font-medium text-[#a3e635]">
                    <span>
                      {language === 'bn'
                        ? 'আপনার ও প্রকৃতির জন্য সেরা'
                        : 'Good for you, good for nature'}
                    </span>
                    <Heart className="w-3.5 h-3.5 fill-current inline" />
                  </span>
                </div>
              </div>

              {/* Right Hero Real Photograph of Wicker Harvest Basket */}
              <div className="lg:col-span-6 min-h-[260px] sm:min-h-[340px] relative overflow-hidden">
                <ProductIllustration
                  productId="hero-showcase"
                  category="hero"
                  title={
                    language === 'bn'
                      ? 'তানজিম এগ্রো ওয়ার্ল্ডের তাজা অর্গানিক ফসল ও সবজি ঝুড়ি'
                      : 'Tanzim Agro World Organic Harvest Basket'
                  }
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* 6-Column EcoMart Category Cards Row with Real Studio Photographs */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(
              [
                {
                  id: 'honey',
                  cat: 'honey' as const,
                  navId: 'honey' as NavSectionId,
                  productId: 'tile-honey',
                  titleEn: 'Honey (মধু)',
                  titleBn: 'খাঁটি মধু (Honey)',
                },
                {
                  id: 'fruits',
                  cat: 'fruits' as const,
                  navId: 'fruits' as NavSectionId,
                  productId: 'tile-fruits',
                  titleEn: 'Fruits & Dates (ফল)',
                  titleBn: 'ফল ও খেজুর (Fruits)',
                },
                {
                  id: 'pickles',
                  cat: 'pickles' as const,
                  navId: 'pickles' as NavSectionId,
                  productId: 'tile-pickles',
                  titleEn: 'Pickles & Spices (আচার)',
                  titleBn: 'আচার ও মসলা (Pickles)',
                },
                {
                  id: 'vegetables',
                  cat: 'vegetables' as const,
                  navId: 'vegetables' as NavSectionId,
                  productId: 'tile-vegetables',
                  titleEn: 'Vegetables (সবজি)',
                  titleBn: 'তাজা সবজি (Vegetables)',
                },
                {
                  id: 'mustard-oil',
                  cat: 'organic' as const,
                  navId: 'organic' as NavSectionId,
                  productId: 'tile-mustard-oil',
                  titleEn: 'Pure Mustard Oil',
                  titleBn: 'ঘানি ভাঙা সরিষার তেল',
                },
                {
                  id: 'spices-aromatics',
                  cat: 'organic' as const,
                  navId: 'organic' as NavSectionId,
                  productId: 'tile-spices',
                  titleEn: 'Date Molasses (গুড়)',
                  titleBn: 'খেজুরের গুড় (Molasses)',
                },
              ] as const
            ).map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => selectCategoryAndScroll(tile.cat, tile.navId)}
                className="group p-3 rounded-xs border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#122117] hover:border-[#097F00] transition-colors text-center cursor-pointer flex flex-col items-center"
              >
                <div className="w-full aspect-square rounded-xs overflow-hidden bg-[#d9e7cb] dark:bg-[#193022]">
                  <ProductIllustration
                    productId={tile.productId}
                    category="category-tile"
                    title={language === 'bn' ? tile.titleBn : tile.titleEn}
                  />
                </div>
                <span className="mt-2.5 text-xs sm:text-[13px] font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#097F00] dark:group-hover:text-emerald-400">
                  {language === 'bn' ? tile.titleBn : tile.titleEn}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: FEATURED PRODUCTS (5-Column EcoMart Real Photo Grid)
           ===================================================================== */}
        <section
          id="featured-products"
          aria-labelledby="featured-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="featured-heading"
              className="text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50"
            >
              {language === 'bn' ? 'বিশেষ পণ্যসমূহ (Featured Products)' : 'Featured Products'}
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeaturedPage((p) => (p === 0 ? 1 : 0))}
                aria-label="Previous featured products"
                className="w-7 h-7 rounded-xs border-2 border-[#097F00] text-[#097F00] dark:border-emerald-400 dark:text-emerald-400 hover:bg-[#097F00] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setFeaturedPage((p) => (p === 0 ? 1 : 0))}
                aria-label="Next featured products"
                className="w-7 h-7 rounded-xs border-2 border-[#097F00] text-[#097F00] dark:border-emerald-400 dark:text-emerald-400 hover:bg-[#097F00] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredProductsList.map((product) => {
              const defaultVariant = product.variants[1] || product.variants[0];
              const isAdded = recentlyAddedId === product.id;

              return (
                <article
                  key={product.id}
                  className="group rounded-xs border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#122117] p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Top Row: Solid Green % OFF Badge + Quick View */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-[#097F00] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xs">
                        {product.discountPercent}% OFF
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveProductModal(product)}
                        aria-label={
                          language === 'bn'
                            ? `${product.nameBn} বিস্তারিত দেখুন`
                            : `View details for ${product.nameEn}`
                        }
                        className="p-1 text-stone-500 hover:text-[#097F00] dark:text-stone-400 dark:hover:text-emerald-400 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Real Studio Product Photograph */}
                    <div
                      onClick={() => setActiveProductModal(product)}
                      className="mt-2 aspect-square w-full rounded-xs overflow-hidden cursor-pointer"
                    >
                      <ProductIllustration
                        productId={product.id}
                        category={product.category}
                        title={language === 'bn' ? product.nameBn : product.nameEn}
                      />
                    </div>

                    {/* Centered Product Title */}
                    <h3 className="mt-3 text-xs sm:text-[13px] font-medium text-center text-stone-800 dark:text-stone-200 line-clamp-2 min-h-[38px]">
                      <button
                        type="button"
                        onClick={() => setActiveProductModal(product)}
                        className="hover:text-[#097F00] dark:hover:text-emerald-400 cursor-pointer"
                      >
                        {language === 'bn' ? product.nameBn : product.nameEn}
                      </button>
                    </h3>

                    {/* Centered Bold Price Range */}
                    <p className="mt-1.5 text-sm sm:text-[15px] font-extrabold text-center text-stone-950 dark:text-white tabular-nums">
                      {getPriceRangeText(product, language)}
                    </p>
                  </div>

                  {/* Full-Width Soft Mint-Green "+ Add to Cart" Button */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product.id, defaultVariant.id, 1)}
                    className="mt-3.5 w-full py-2 px-3 rounded-xs bg-[#dcefdc] hover:bg-[#097F00] text-[#097F00] hover:text-white dark:bg-emerald-950/90 dark:text-emerald-300 dark:hover:bg-[#097F00] dark:hover:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{language === 'bn' ? 'যুক্ত হয়েছে' : 'Added to Cart'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{language === 'bn' ? 'ব্যাগে যোগ করুন' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            SECTION 3: PRODUCTS WITH DISCOUNTS (Green Bordered Box: Left 2 Promo
            Banners + Right 2x3 Compact Horizontal Cards with "Add 🛒" Button)
           ===================================================================== */}
        <section
          id="discount-section"
          aria-labelledby="discount-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="discount-heading"
              className="text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50"
            >
              {language === 'bn'
                ? 'বিশেষ ছাড়ের পণ্য (Products With Discounts)'
                : 'Products With Discounts'}
            </h2>

            <a
              href="#recent-products"
              onClick={(e) => {
                e.preventDefault();
                selectCategoryAndScroll('all', 'shop');
              }}
              className="px-4 py-2 rounded-xs bg-[#097F00] hover:bg-[#076300] text-white text-xs font-bold transition-colors"
            >
              {language === 'bn' ? 'সব দেখুন' : 'View More'}
            </a>
          </div>

          <div className="p-4 rounded-md border border-[#097F00] bg-white dark:bg-[#0f1d14] grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left Column: 2 Stacked Promotional Combo Banners with Real Photos */}
            <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
              {/* Green Promo Banner */}
              <div
                onClick={() => handleAddToCart('honey-khalisha', '1kg', 1)}
                className="flex-1 p-5 rounded-md bg-gradient-to-r from-[#097F00] via-[#15803d] to-[#064e14] text-white flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold leading-snug">
                    {language === 'bn'
                      ? 'সুন্দরবনের খলিশা মধু ১ কেজি ফ্যামিলি প্যাক'
                      : 'Sundarbans Raw Khalisha Honey 1kg Pack'}
                  </h3>
                  <div className="pt-2">
                    <span className="block text-xs font-medium text-emerald-100">
                      {language === 'bn' ? 'মাত্র' : 'Only'}
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                      1292TK
                    </span>
                  </div>
                </div>
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-white p-1 shadow-sm">
                  <ProductIllustration
                    productId="honey-khalisha"
                    category="honey"
                    title="Sundarbans Honey Promo"
                  />
                </div>
              </div>

              {/* Amber/Gold Promo Banner */}
              <div
                onClick={() => handleAddToCart('fruits-himsagar-mango', '5kg', 1)}
                className="flex-1 p-5 rounded-md bg-gradient-to-r from-[#d97706] via-[#e08206] to-[#b45309] text-white flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold leading-snug">
                    {language === 'bn'
                      ? 'রাজশাহীর হিমসাগর আম ও কাশ্মীরি আচার কম্বো'
                      : 'Rajshahi Himsagar Mango & Achar Combo'}
                  </h3>
                  <div className="pt-2">
                    <span className="block text-xs font-medium text-amber-100">
                      {language === 'bn' ? 'মাত্র' : 'Only'}
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                      729TK
                    </span>
                  </div>
                </div>
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-white p-1 shadow-sm">
                  <ProductIllustration
                    productId="fruits-himsagar-mango"
                    category="fruits"
                    title="Rajshahi Mango Promo"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: 2x3 Grid of Compact Horizontal Product Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {discountedHorizontalProducts.map((product) => {
                const defaultVariant = product.variants[1] || product.variants[0];
                const isAdded = recentlyAddedId === product.id;

                return (
                  <div
                    key={product.id}
                    className="group p-3 rounded-xs border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#122117] flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => setActiveProductModal(product)}
                      className="w-20 h-20 shrink-0 rounded-xs border border-stone-200 dark:border-emerald-900/40 overflow-hidden cursor-pointer"
                    >
                      <ProductIllustration
                        productId={product.id}
                        category={product.category}
                        title={language === 'bn' ? product.nameBn : product.nameEn}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-semibold text-stone-900 dark:text-stone-100 truncate">
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          className="hover:text-[#097F00] cursor-pointer text-left truncate block w-full"
                        >
                          {language === 'bn' ? product.nameBn : product.nameEn}
                        </button>
                      </h3>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-stone-950 dark:text-white tabular-nums">
                          {getPriceRangeText(product, language)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(product.id, defaultVariant.id, 1)
                          }
                          className="px-2.5 py-1 rounded-xs border border-[#097F00] text-[#097F00] hover:bg-[#097F00] hover:text-white dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-[#097F00] dark:hover:text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <span>
                            {isAdded
                              ? language === 'bn'
                                ? 'যুক্ত'
                                : 'Added'
                              : language === 'bn'
                                ? 'যোগ করুন'
                                : 'Add'}
                          </span>
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 4: RECENT PRODUCTS (5-Column Full Catalog Grid with
            Category Tabs, Search & Sort)
           ===================================================================== */}
        <section
          id="recent-products"
          aria-labelledby="recent-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2
              id="recent-heading"
              className="text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50"
            >
              {language === 'bn'
                ? 'সাম্প্রতিক পণ্যসমূহ (Recent Products)'
                : 'Recent Products'}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="catalog-sort" className="sr-only">
                {language === 'bn' ? 'সাজানোর ক্রম' : 'Sort products'}
              </label>
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 rounded-xs border border-stone-300 dark:border-emerald-800 bg-white dark:bg-[#122117] text-xs font-semibold text-stone-800 dark:text-stone-200"
              >
                <option value="featured">
                  {language === 'bn' ? 'সেরা ও জনপ্রিয় পণ্য' : 'Sort: Featured'}
                </option>
                <option value="price-asc">
                  {language === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}
                </option>
                <option value="price-desc">
                  {language === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}
                </option>
                <option value="rating">
                  {language === 'bn' ? 'সর্বোচ্চ রেটিং' : 'Highest Rated'}
                </option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveNav('shop');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 rounded-xs bg-[#097F00] hover:bg-[#076300] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'সকল পণ্য দেখুন' : 'View More'}
              </button>
            </div>
          </div>

          {/* Interactive Category Filter Buttons */}
          <div
            role="tablist"
            aria-label="Filter Recent Products by Category"
            className="mb-5 flex flex-wrap items-center gap-2"
          >
            {CATEGORY_LIST.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveNav(cat.id === 'all' ? 'shop' : cat.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xs text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#097F00] text-white border-[#097F00]'
                      : 'bg-white dark:bg-[#122117] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-emerald-900/60 hover:border-[#097F00]'
                  }`}
                >
                  {language === 'bn' ? cat.labelBn : cat.labelEn} ({cat.count})
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 rounded-md border border-stone-200 dark:border-emerald-900/50 text-center space-y-3">
              <p className="text-base font-bold">
                {language === 'bn'
                  ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি'
                  : 'No products found matching your search'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xs bg-[#097F00] text-white text-xs font-bold cursor-pointer"
              >
                {language === 'bn' ? 'সকল পণ্য দেখুন' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const defaultVariant = product.variants[1] || product.variants[0];
                const isAdded = recentlyAddedId === product.id;

                return (
                  <article
                    key={product.id}
                    className="group rounded-xs border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#122117] p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block bg-[#097F00] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xs">
                          {product.discountPercent}% OFF
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          aria-label={
                            language === 'bn'
                              ? `${product.nameBn} বিস্তারিত দেখুন`
                              : `View details for ${product.nameEn}`
                          }
                          className="p-1 text-stone-500 hover:text-[#097F00] dark:text-stone-400 dark:hover:text-emerald-400 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        onClick={() => setActiveProductModal(product)}
                        className="mt-2 aspect-square w-full rounded-xs overflow-hidden cursor-pointer"
                      >
                        <ProductIllustration
                          productId={product.id}
                          category={product.category}
                          title={language === 'bn' ? product.nameBn : product.nameEn}
                        />
                      </div>

                      <h3 className="mt-3 text-xs sm:text-[13px] font-medium text-center text-stone-800 dark:text-stone-200 line-clamp-2 min-h-[38px]">
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          className="hover:text-[#097F00] dark:hover:text-emerald-400 cursor-pointer"
                        >
                          {language === 'bn' ? product.nameBn : product.nameEn}
                        </button>
                      </h3>

                      <p className="mt-1.5 text-sm sm:text-[15px] font-extrabold text-center text-stone-950 dark:text-white tabular-nums">
                        {getPriceRangeText(product, language)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id, defaultVariant.id, 1)}
                      className="mt-3.5 w-full py-2 px-3 rounded-xs bg-[#dcefdc] hover:bg-[#097F00] text-[#097F00] hover:text-white dark:bg-emerald-950/90 dark:text-emerald-300 dark:hover:bg-[#097F00] dark:hover:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{language === 'bn' ? 'যুক্ত হয়েছে' : 'Added to Cart'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{language === 'bn' ? 'ব্যাগে যোগ করুন' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================================
            SECTION 5: BEST SELL PRODUCT (Light Gray-Green Band matching EcoMart)
           ===================================================================== */}
        <section
          id="bestsell-section"
          aria-labelledby="bestsell-heading"
          className="bg-[#f4f6f8] dark:bg-[#0f1c14] py-8 mt-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="bestsell-heading"
                className="text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50"
              >
                {language === 'bn'
                  ? 'সর্বাধিক বিক্রিত পণ্য (Best Sell Product)'
                  : 'Best Sell Product'}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBestSellPage((p) => (p === 0 ? 1 : 0))}
                  aria-label="Previous best selling products"
                  className="w-7 h-7 rounded-xs border-2 border-[#097F00] text-[#097F00] dark:border-emerald-400 dark:text-emerald-400 hover:bg-[#097F00] hover:text-white flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-[#122117]"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setBestSellPage((p) => (p === 0 ? 1 : 0))}
                  aria-label="Next best selling products"
                  className="w-7 h-7 rounded-xs border-2 border-[#097F00] text-[#097F00] dark:border-emerald-400 dark:text-emerald-400 hover:bg-[#097F00] hover:text-white flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-[#122117]"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {bestSellProductsList.map((product) => {
                const defaultVariant = product.variants[1] || product.variants[0];
                const isAdded = recentlyAddedId === product.id;

                return (
                  <article
                    key={`best-${product.id}`}
                    className="group rounded-xs border border-stone-200 dark:border-emerald-900/60 bg-white dark:bg-[#122117] p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block bg-[#097F00] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xs">
                          {product.discountPercent}% OFF
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          aria-label={
                            language === 'bn'
                              ? `${product.nameBn} বিস্তারিত দেখুন`
                              : `View details for ${product.nameEn}`
                          }
                          className="p-1 text-stone-500 hover:text-[#097F00] dark:text-stone-400 dark:hover:text-emerald-400 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        onClick={() => setActiveProductModal(product)}
                        className="mt-2 aspect-square w-full rounded-xs overflow-hidden cursor-pointer"
                      >
                        <ProductIllustration
                          productId={product.id}
                          category={product.category}
                          title={language === 'bn' ? product.nameBn : product.nameEn}
                        />
                      </div>

                      <h3 className="mt-3 text-xs sm:text-[13px] font-medium text-center text-stone-800 dark:text-stone-200 line-clamp-2 min-h-[38px]">
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          className="hover:text-[#097F00] dark:hover:text-emerald-400 cursor-pointer"
                        >
                          {language === 'bn' ? product.nameBn : product.nameEn}
                        </button>
                      </h3>

                      <p className="mt-1.5 text-sm sm:text-[15px] font-extrabold text-center text-stone-950 dark:text-white tabular-nums">
                        {getPriceRangeText(product, language)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id, defaultVariant.id, 1)}
                      className="mt-3.5 w-full py-2 px-3 rounded-xs bg-[#dcefdc] hover:bg-[#097F00] text-[#097F00] hover:text-white dark:bg-emerald-950/90 dark:text-emerald-300 dark:hover:bg-[#097F00] dark:hover:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{language === 'bn' ? 'যুক্ত হয়েছে' : 'Added to Cart'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{language === 'bn' ? 'ব্যাগে যোগ করুন' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 6: 3 WEEKEND DISCOUNT PROMO CARDS & 4 SERVICE TRUST BADGES
            (Matching bottom of ecomart.borbila.net with real photos)
           ===================================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div
              onClick={() => selectCategoryAndScroll('honey', 'honey')}
              className="p-6 rounded-md bg-[#f5f8d7] dark:bg-[#192412] border border-lime-200 dark:border-emerald-900/60 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-xs bg-[#097F00] text-white text-xs font-bold">
                  {language === 'bn' ? 'উইকএন্ড ছাড়' : 'Weekend Discount'}
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white pt-1">
                  {language === 'bn' ? 'সুন্দরবনের খাঁটি মধু' : 'Sundarbans Raw Honey'}
                </h3>
                <p className="text-sm font-semibold text-[#097F00] dark:text-emerald-400">
                  {language === 'bn' ? 'শতভাগ প্রাকৃতিক ও ল্যাব টেস্টেড' : '100% Pure & Unheated'}
                </p>
                <div className="pt-2 inline-flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-[#097F00] text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>{language === 'bn' ? 'এখনই কিনুন' : 'Shop Now'}</span>
                </div>
              </div>
              <div className="w-28 h-28 shrink-0 rounded-md overflow-hidden shadow-xs">
                <ProductIllustration
                  productId="honey-khalisha"
                  category="honey"
                  title="Sundarbans Honey Weekend Discount"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => selectCategoryAndScroll('pickles', 'pickles')}
              className="p-6 rounded-md bg-[#dce8dd] dark:bg-[#13261a] border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-xs bg-[#097F00] text-white text-xs font-bold">
                  {language === 'bn' ? 'উইকএন্ড ছাড়' : 'Weekend Discount'}
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white pt-1">
                  {language === 'bn' ? 'ঐতিহ্যবাহী আমের আচার' : 'Artisanal Mango Achar'}
                </h3>
                <p className="text-sm font-semibold text-[#097F00] dark:text-emerald-400">
                  {language === 'bn' ? 'ঘানি ভাঙা সরিষার তেলে তৈরি' : 'Sun-Cured Heritage Taste'}
                </p>
                <div className="pt-2 inline-flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-[#097F00] text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>{language === 'bn' ? 'এখনই কিনুন' : 'Shop Now'}</span>
                </div>
              </div>
              <div className="w-28 h-28 shrink-0 rounded-md overflow-hidden shadow-xs">
                <ProductIllustration
                  productId="pickle-mango-kasundi"
                  category="pickles"
                  title="Mango Achar Weekend Discount"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => selectCategoryAndScroll('fruits', 'fruits')}
              className="p-6 rounded-md bg-[#e5e8eb] dark:bg-[#16221d] border border-stone-200 dark:border-emerald-900/60 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-xs bg-[#097F00] text-white text-xs font-bold">
                  {language === 'bn' ? 'উইকএন্ড ছাড়' : 'Weekend Discount'}
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white pt-1">
                  {language === 'bn' ? 'ফরমালিন মুক্ত তাজা ফল' : 'Orchard Fresh Fruits'}
                </h3>
                <p className="text-sm font-semibold text-[#097F00] dark:text-emerald-400">
                  {language === 'bn' ? 'সরাসরি বাগান থেকে সংগৃহীত' : 'Flavors Awesome'}
                </p>
                <div className="pt-2 inline-flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-[#097F00] text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span>{language === 'bn' ? 'এখনই কিনুন' : 'Shop Now'}</span>
                </div>
              </div>
              <div className="w-28 h-28 shrink-0 rounded-md overflow-hidden shadow-xs">
                <ProductIllustration
                  productId="fruits-himsagar-mango"
                  category="fruits"
                  title="Fresh Mango Weekend Discount"
                />
              </div>
            </div>
          </div>

          {/* 4-Column EcoMart Service Guarantee Strip */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-stone-200 dark:border-emerald-900/50">
            <div className="flex items-center gap-3.5 p-3">
              <div className="w-11 h-11 rounded-full bg-[#dcfce7] dark:bg-emerald-950 text-[#097F00] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {language === 'bn' ? '৬০ মিনিটে ডেলিভারি' : '60 mins delivery'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {language === 'bn' ? '১৫০০ টাকার বেশি অর্ডারে ফ্রি শিপিং' : 'Free shipping over 1500Tk'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-11 h-11 rounded-full bg-[#dcfce7] dark:bg-emerald-950 text-[#097F00] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {language === 'bn' ? 'অনুমোদিত অর্গানিক পণ্য' : 'Authorized Products'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {language === 'bn' ? 'BCSIR ও BARI ল্যাব পরীক্ষিত' : 'within 30 days for an exchange'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-11 h-11 rounded-full bg-[#dcfce7] dark:bg-emerald-950 text-[#097F00] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {language === 'bn' ? 'কাস্টমার সাপোর্ট' : 'Customer Support'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {language === 'bn' ? 'সকাল ৮টা – রাত ১০টা' : '8am - 10pm'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3">
              <div className="w-11 h-11 rounded-full bg-[#dcfce7] dark:bg-emerald-950 text-[#097F00] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {language === 'bn' ? 'নিরাপদ পেমেন্ট গেটওয়ে' : 'Flexible Payments'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {language === 'bn' ? 'বিকাশ, নগদ, কার্ড ও ক্যাশ অন ডেলিভারি' : 'bKash, Nagad, Cards & COD'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          ECOMART 4-COLUMN FOOTER
         ===================================================================== */}
      <footer className="bg-[#f8faf7] dark:bg-[#08100b] border-t border-stone-200 dark:border-emerald-900/50 text-xs text-stone-600 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand, Address, Phone & Official Facebook */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#097F00] flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="text-base font-extrabold text-[#097F00] dark:text-emerald-400">
                {language === 'bn' ? 'তানজিম এগ্রো ওয়ার্ল্ড' : 'TANZIM AGRO WORLD'}
              </span>
            </div>
            <p className="leading-relaxed">
              {language === 'bn'
                ? 'খাঁটি মধু (মধু), মৌসুমি ফল (ফল), ঐতিহ্যবাহী আচার (আচার), তাজা সবজি (সবজি) এবং নিত্যপ্রয়োজনীয় অর্গানিক খাদ্যের বিশ্বস্ত অনলাইন স্টোর (tanzimagroworld.com)।'
                : 'Your trusted online organic grocery store (tanzimagroworld.com) for pure honey (মধু), fresh fruits (ফল), artisanal pickles (আচার), and farm vegetables (সবজি).'}
            </p>
            <div className="space-y-1 text-[11px] text-stone-700 dark:text-stone-300">
              <p className="font-semibold">
                {language === 'bn'
                  ? 'ঠিকানা: তালা, সাতক্ষীরা, সাতক্ষীরা, বাংলাদেশ, ৯২২০'
                  : 'Address: Tala, Satkhira, Satkhira, Bangladesh, 9220'}
              </p>
              <p className="font-semibold">
                {language === 'bn' ? 'ফোন: ' : 'Phone: '}
                <a
                  href="tel:01757876606"
                  className="text-[#097F00] dark:text-emerald-400 hover:underline tabular-nums"
                >
                  01757876606
                </a>
              </p>
            </div>
            <div className="pt-1">
              <a
                href="https://www.facebook.com/profile.php?id=61579066244450"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>
                  {language === 'bn' ? 'ফেসবুক পেইজ ভিজিট করুন' : 'Follow us on Facebook'}
                </span>
              </a>
            </div>
          </div>

          {/* Col 2: Shop Links */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {language === 'bn' ? 'শপ লিংকস (Shop Links)' : 'Shop Links'}
            </h2>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => selectCategoryAndScroll('honey', 'honey')}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'সুন্দরবনের মধু (Honey)' : 'Sundarbans Raw Honey (মধু)'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => selectCategoryAndScroll('fruits', 'fruits')}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'মৌসুমি ফল (Fruits)' : 'Orchard Fresh Fruits (ফল)'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => selectCategoryAndScroll('pickles', 'pickles')}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'ঐতিহ্যবাহী আচার (Pickles)' : 'Artisanal Pickles (আচার)'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => selectCategoryAndScroll('vegetables', 'vegetables')}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'তাজা সবজি (Vegetables)' : 'Organic Vegetables (সবজি)'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {language === 'bn' ? 'গ্রাহক সেবা (Customer Service)' : 'Customer Service'}
            </h2>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setIsTrackOrderOpen(true)}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'অর্ডার ট্র্যাক করুন (Track Order)' : 'Track Order Status'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'মাল্টি-ডিভাইস ডেটা সিঙ্ক' : 'Multi-Device Data Sync'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => triggerPushNotification()}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'পুশ নোটিফিকেশন অ্যালার্ট' : 'Push Notification Alerts'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="hover:text-[#097F00] cursor-pointer"
                >
                  {language === 'bn' ? 'বিকাশ ও নগদ পেমেন্ট গেটওয়ে' : 'bKash & Nagad Payment Gateway'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Information & Verified Payment Banner */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {language === 'bn' ? 'যোগাযোগ ও তথ্য (Contact & Info)' : 'Contact & Information'}
            </h2>
            <ul className="space-y-2">
              <li>
                {language === 'bn'
                  ? 'তালা, সাতক্ষীরা, সাতক্ষীরা, বাংলাদেশ, ৯২২০'
                  : 'Tala, Satkhira, Satkhira, Bangladesh, 9220'}
              </li>
              <li>
                {language === 'bn' ? 'হটলাইন: ' : 'Helpline: '}
                <a
                  href="tel:01757876606"
                  className="font-bold text-stone-900 dark:text-white hover:text-[#097F00] tabular-nums"
                >
                  01757876606
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61579066244450"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#097F00] dark:text-emerald-400 font-semibold hover:underline"
                >
                  {language === 'bn'
                    ? 'অফিসিয়াল ফেসবুক পেইজ'
                    : 'Official Facebook Page'}
                </a>
              </li>
              <li>100% Chemical &amp; Formalin-Free Policy</li>
            </ul>
            <div className="pt-2">
              <img
                src="/images/products/sslcommerz-footer.png"
                alt="Verified SSLCommerz Payment Methods: bKash, Nagad, Rocket, Visa, Mastercard"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain rounded-xs"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 dark:border-emerald-900/50 py-4 px-4 sm:px-6 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <p>
            © {new Date().getFullYear()} Tanzim Agro World (tanzimagroworld.com) · Tala, Satkhira, Bangladesh, 9220 ·{' '}
            <a href="tel:01757876606" className="font-semibold hover:text-[#097F00]">
              01757876606
            </a>
          </p>
          <p className="font-semibold text-[#097F00] dark:text-emerald-400">
            মধু • ফল • আচার • সবজি • Organic Food Bangladesh
          </p>
        </div>
      </footer>

      {/* Offline Resilience Banner */}
      <OfflineIndicator language={language} simulatedOffline={simulatedOffline} />

      {/* Contiguous Purchase Module (PDP Modal) */}
      <ProductDetailModal
        product={activeProductModal}
        language={language}
        onClose={() => setActiveProductModal(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Cart & Integrated Payment Gateway Drawer */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        language={language}
        cartSummary={cartSummary}
        division={division}
        promoCode={promoCode}
        onChangeDivision={setDivision}
        onChangePromoCode={setPromoCode}
        onUpdateQuantity={(productId, variantId, delta) =>
          setCart((prev) => updateCartItems(prev, productId, variantId, delta))
        }
        onClearCart={() => setCart([])}
        onCompleteOrder={handleCompleteOrder}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Multi-Device Sync & Push Notification Center Modal */}
      <SyncAndNotificationModal
        isOpen={isSyncModalOpen}
        language={language}
        syncPayload={syncPayload}
        lastSyncedAt={lastSyncedAt}
        notifications={notifications}
        simulatedOffline={simulatedOffline}
        onToggleSimulatedOffline={() => setSimulatedOffline((prev) => !prev)}
        onImportSyncPayload={handleImportSyncPayload}
        onTriggerPushNotification={() => triggerPushNotification()}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* EcoMart Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        language={language}
        orders={orders}
        onClose={() => setIsTrackOrderOpen(false)}
      />
    </div>
  );
}
