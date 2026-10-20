import React, { useState } from 'react';
import type { CategoryId } from '../utils/storeLogic';

interface ProductIllustrationProps {
  productId: string;
  category: Exclude<CategoryId, 'all'> | 'hero' | 'category-tile';
  title: string;
  className?: string;
}

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Hero Banner
  'hero-showcase': '/images/products/hero-basket.webp',

  // Category Tiles (6-column strip)
  'tile-honey': '/images/products/cat-tile-honey.png',
  'tile-fruits': '/images/products/cat-tile-dates.png',
  'tile-pickles': '/images/products/cat-tile-masala.png',
  'tile-vegetables': '/images/products/cat-tile-veg.png',
  'tile-mustard-oil': '/images/products/cat-tile-oil.png',
  'tile-spices': '/images/products/cat-tile-khejur.png',

  // Products
  'honey-khalisha': '/images/products/cat-tile-honey.png',
  'honey-kalojira': '/images/products/honey-alshifa.webp',
  'fruits-himsagar-mango': '/images/products/fruits-mango.jpg',
  'fruits-kalmi-dates': '/images/products/dates-kalmi.webp',
  'fruits-dinajpur-litchi': '/images/products/fruits-litchi.jpg',
  'pickle-mango-kasundi': '/images/products/pickle-mango.jpg',
  'pickle-garlic-naga': '/images/products/pickle-garlic.jpg',
  'veg-seasonal-box': '/images/products/organic-cucumber.png',
  'veg-green-chili': '/images/products/fresh-green-chili.png',
  'veg-deshi-aromatics': '/images/products/organic-onion.png',
  'veg-organic-garlic': '/images/products/organic-garlic.png',
  'veg-organic-ginger': '/images/products/organic-ginger.png',
  'organic-gawa-ghee': '/images/products/pure-gawa-ghee.png',
  'organic-mustard-oil': '/images/products/cat-tile-oil.png',
  'organic-patali-gur': '/images/products/cat-tile-khejur.png',
};

const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  honey: '/images/products/cat-tile-honey.png',
  fruits: '/images/products/cat-tile-dates.png',
  pickles: '/images/products/pickle-mango.jpg',
  vegetables: '/images/products/cat-tile-veg.png',
  organic: '/images/products/pure-gawa-ghee.png',
  'category-tile': '/images/products/cat-tile-veg.png',
  hero: '/images/products/hero-basket.webp',
};

/**
 * Renders real, high-resolution studio product photographs for Tanzim Agro World.
 * Includes a resilient fallback container to satisfy the Zero-Broken-Image Policy.
 */
export const ProductIllustration: React.FC<ProductIllustrationProps> = ({
  productId,
  category,
  title,
  className = 'w-full h-full',
}) => {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc =
    PRODUCT_IMAGE_MAP[productId] ||
    CATEGORY_FALLBACK_IMAGE[category] ||
    '/images/products/cat-tile-honey.png';

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={title}
        className={`flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-lime-100 dark:from-emerald-950 dark:to-stone-900 text-emerald-900 dark:text-emerald-200 text-center ${className}`}
      >
        <span className="text-xs font-bold line-clamp-2">{title}</span>
      </div>
    );
  }

  if (category === 'hero') {
    return (
      <div className={`relative overflow-hidden bg-[#064708] flex justify-end ${className}`}>
        <img
          src={resolvedSrc}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-[195%] max-w-none h-full object-cover object-right shrink-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#075708] via-[#075708]/70 to-transparent"
        />
      </div>
    );
  }

  if (category === 'category-tile') {
    return (
      <div className={`relative overflow-hidden bg-[#d9e7cb] dark:bg-[#182c1f] ${className}`}>
        <img
          src={resolvedSrc}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#16271c] flex items-center justify-center ${className}`}
    >
      <img
        src={resolvedSrc}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
};
