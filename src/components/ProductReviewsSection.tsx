import React, { useEffect, useMemo, useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquarePlus, UserCheck } from 'lucide-react';
import type { Language, Product } from '../utils/storeLogic';

export interface ProductReviewItem {
  id: string;
  productId: string;
  authorName: string;
  location: string;
  rating: number;
  variantLabel: string;
  commentEn: string;
  commentBn: string;
  createdAt: string;
  verified: boolean;
  helpfulCount: number;
}

const REVIEWS_STORAGE_KEY = 'tanzim_agro_product_reviews_v1';

const RATING_LABELS: Record<number, { en: string; bn: string }> = {
  5: { en: '5 Stars – Excellent Quality', bn: '৫ স্টার – অসাধারণ মান' },
  4: { en: '4 Stars – Very Good', bn: '৪ স্টার – খুব ভালো' },
  3: { en: '3 Stars – Good', bn: '৩ স্টার – ভালো' },
  2: { en: '2 Stars – Fair', bn: '২ স্টার – মোটামুটি' },
  1: { en: '1 Star – Needs Improvement', bn: '১ স্টার – মানসম্মত নয়' },
};

function getSeedReviewsForProduct(product: Product): ProductReviewItem[] {
  const defaultVariant =
    product.variants[1]?.labelEn || product.variants[0]?.labelEn || '500g Pack';

  if (product.category === 'honey') {
    return [
      {
        id: `seed-${product.id}-1`,
        productId: product.id,
        authorName: 'Tanvir Ahmed',
        location: 'Satkhira',
        rating: 5,
        variantLabel: defaultVariant,
        commentEn:
          '100% authentic raw honey from Tala, Satkhira. The aroma, natural viscosity, and floral taste are unmatched. Passed home purity tests easily.',
        commentBn:
          'তালা, সাতক্ষীরার শতভাগ খাঁটি ও প্রাকৃতিক মধু। ঘ্রাণ এবং স্বাদ অসাধারণ, ল্যাব সনদসহ একদম অর্গানিক।',
        createdAt: '2 days ago',
        verified: true,
        helpfulCount: 14,
      },
      {
        id: `seed-${product.id}-2`,
        productId: product.id,
        authorName: 'Nusrat Jahan',
        location: 'Dhaka',
        rating: 5,
        variantLabel: product.variants[0]?.labelEn || '250g',
        commentEn:
          'Ordered for my parents. Glass jar packaging was leak-proof and delivery was super fast.',
        commentBn:
          'পরিবারের জন্য অর্ডার করেছিলাম। কাঁচের জারের প্যাকিং খুব নিরাপদ ছিল এবং ডেলিভারি দ্রুত পেয়েছি।',
        createdAt: '1 week ago',
        verified: true,
        helpfulCount: 9,
      },
    ];
  }

  if (product.category === 'fruits') {
    return [
      {
        id: `seed-${product.id}-1`,
        productId: product.id,
        authorName: 'Rafiqul Islam',
        location: 'Khulna',
        rating: 5,
        variantLabel: defaultVariant,
        commentEn:
          'Completely formalin-free and naturally ripened. Sweet, fibrousless, and fresh right out of the breathable crate.',
        commentBn:
          'একদম ফরমালিন মুক্ত ও গাছপাকা। মিষ্টি এবং তাজা ফল, বাচ্চারা খুব পছন্দ করেছে।',
        createdAt: '3 days ago',
        verified: true,
        helpfulCount: 11,
      },
      {
        id: `seed-${product.id}-2`,
        productId: product.id,
        authorName: 'Farhana Yasmin',
        location: 'Chattogram',
        rating: 4,
        variantLabel: product.variants[0]?.labelEn || '1kg',
        commentEn:
          'Very fresh orchard harvest and accurate weight. Will definitely order again.',
        commentBn:
          'ওজনে একদম সঠিক এবং বাগানের তাজা ফল। আবার অর্ডার করবো ইনশাআল্লাহ।',
        createdAt: '6 days ago',
        verified: true,
        helpfulCount: 6,
      },
    ];
  }

  if (product.category === 'pickles') {
    return [
      {
        id: `seed-${product.id}-1`,
        productId: product.id,
        authorName: 'Sadia Afrin',
        location: 'Dhaka',
        rating: 5,
        variantLabel: defaultVariant,
        commentEn:
          'Tastes just like homemade grandma-style achar! You can smell the pure cold-pressed mustard oil and roasted panch phoron.',
        commentBn:
          'একদম ঘরোয়া স্বাদের ঐতিহ্যবাহী আচার! ঘানি ভাঙা খাঁটি সরিষার তেল ও পাঁচফোড়নের ঘ্রাণ অসাধারণ।',
        createdAt: '4 days ago',
        verified: true,
        helpfulCount: 18,
      },
      {
        id: `seed-${product.id}-2`,
        productId: product.id,
        authorName: 'Mehedi Hasan',
        location: 'Rajshahi',
        rating: 5,
        variantLabel: product.variants[0]?.labelEn || '250g',
        commentEn:
          'Zero artificial preservatives or vinegar burn. Goes wonderfully with khichuri and polao.',
        commentBn:
          'কোনো কৃত্রিম প্রিজারভেটিভ নেই। খিচুড়ি ও পোলাওয়ের সাথে খেতে দারুণ লাগে।',
        createdAt: '2 weeks ago',
        verified: true,
        helpfulCount: 8,
      },
    ];
  }

  return [
    {
      id: `seed-${product.id}-1`,
      productId: product.id,
      authorName: 'Kamrul Hasan',
      location: 'Satkhira',
      rating: 5,
      variantLabel: defaultVariant,
      commentEn:
        'Crisp, clean, and genuinely organic farm produce from Tanzim Agro World. Highly trustworthy quality.',
      commentBn:
        'তানজিম এগ্রো ওয়ার্ল্ডের একদম তাজা ও কীটনাশক মুক্ত অর্গানিক পণ্য। গুণে ও মানে শতভাগ বিশ্বস্ত।',
      createdAt: '1 day ago',
      verified: true,
      helpfulCount: 12,
    },
    {
      id: `seed-${product.id}-2`,
      productId: product.id,
      authorName: 'abdul.kader',
      location: 'Sylhet',
      rating: 5,
      variantLabel: product.variants[0]?.labelEn || '500g',
      commentEn:
        'Great packaging and authentic rural sourcing. Worth every Taka.',
      commentBn:
        'চমৎকার প্যাকেজিং এবং খাঁটি দেশি পণ্য। দাম অনুযায়ী মান খুবই ভালো।',
      createdAt: '5 days ago',
      verified: true,
      helpfulCount: 7,
    },
  ];
}

interface ProductReviewsSectionProps {
  product: Product;
  language: Language;
  onStatsChange?: (avgRating: number, totalCount: number) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  language,
  onStatsChange,
}) => {
  const [userReviews, setUserReviews] = useState<ProductReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('');
  const [location, setLocation] = useState<string>('Satkhira');
  const [selectedVariantLabel, setSelectedVariantLabel] = useState<string>(
    product.variants[1]?.labelEn || product.variants[0]?.labelEn || ''
  );
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [helpfulVotedIds, setHelpfulVotedIds] = useState<string[]>([]);
  const [filterStar, setFilterStar] = useState<number | 'all'>('all');

  useEffect(() => {
    setSelectedVariantLabel(
      product.variants[1]?.labelEn || product.variants[0]?.labelEn || ''
    );
    setErrorMsg(null);
    setSubmittedSuccess(false);
    setFilterStar('all');
  }, [product.id, product.variants]);

  const seedReviews = useMemo(() => getSeedReviewsForProduct(product), [product]);

  const productUserReviews = useMemo(
    () => userReviews.filter((r) => r.productId === product.id),
    [userReviews, product.id]
  );

  const allProductReviews = useMemo(
    () => [...productUserReviews, ...seedReviews],
    [productUserReviews, seedReviews]
  );

  const reviewStats = useMemo(() => {
    const baseCount = product.reviewCount;
    const baseTotalScore = product.rating * baseCount;
    const addedCount = productUserReviews.length;
    const addedScore = productUserReviews.reduce((acc, r) => acc + r.rating, 0);
    const totalCount = baseCount + addedCount;
    const avgRating =
      totalCount > 0 ? Number(((baseTotalScore + addedScore) / totalCount).toFixed(1)) : 5.0;

    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allProductReviews.forEach((r) => {
      const clamped = Math.min(5, Math.max(1, Math.round(r.rating)));
      starCounts[clamped] = (starCounts[clamped] || 0) + 1;
    });

    return { avgRating, totalCount, starCounts };
  }, [product.rating, product.reviewCount, productUserReviews, allProductReviews]);

  useEffect(() => {
    onStatsChange?.(reviewStats.avgRating, reviewStats.totalCount);
  }, [reviewStats.avgRating, reviewStats.totalCount, onStatsChange]);

  const displayedReviews = useMemo(() => {
    if (filterStar === 'all') return allProductReviews;
    return allProductReviews.filter((r) => Math.round(r.rating) === filterStar);
  }, [allProductReviews, filterStar]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = comment.trim();
    const trimmedName = authorName.trim();

    if (selectedRating < 1 || selectedRating > 5) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে ১ থেকে ৫ স্টার রেটিং নির্বাচন করুন।'
          : 'Please select a star rating between 1 and 5.'
      );
      return;
    }

    if (trimmedComment.length < 5) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে পণ্য সম্পর্কে আপনার মতামত লিখুন (কমপক্ষে ৫ অক্ষর)।'
          : 'Please write your review feedback (at least 5 characters).'
      );
      return;
    }

    const newReview: ProductReviewItem = {
      id: 'rev-' + Date.now(),
      productId: product.id,
      authorName:
        trimmedName || (language === 'bn' ? 'সম্মানিত গ্রাহক' : 'Verified Customer'),
      location: location.trim() || 'Bangladesh',
      rating: selectedRating,
      variantLabel:
        selectedVariantLabel ||
        product.variants[0]?.labelEn ||
        'Standard Pack',
      commentEn: trimmedComment,
      commentBn: trimmedComment,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      verified: true,
      helpfulCount: 1,
    };

    const nextReviews = [newReview, ...userReviews];
    setUserReviews(nextReviews);
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(nextReviews));
    } catch {
      // Ignore quota errors
    }

    setComment('');
    setAuthorName('');
    setErrorMsg(null);
    setSubmittedSuccess(true);
    setFilterStar('all');
    setTimeout(() => setSubmittedSuccess(false), 4500);
  };

  const handleHelpfulClick = (reviewId: string) => {
    if (helpfulVotedIds.includes(reviewId)) return;
    setHelpfulVotedIds((prev) => [...prev, reviewId]);
    setUserReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      )
    );
  };

  const activeStarDisplay = hoverRating || selectedRating;

  return (
    <section
      aria-labelledby="pdp-reviews-heading"
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h3
            id="pdp-reviews-heading"
            className="text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2"
          >
            <MessageSquarePlus className="w-5 h-5 text-[#097F00] dark:text-emerald-400" />
            <span>
              {language === 'bn'
                ? 'গ্রাহক রিভিউ ও রেটিং (Customer Reviews & Ratings)'
                : 'Customer Reviews & Ratings'}
            </span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {language === 'bn'
              ? 'যাচাইকৃত ক্রেতাদের প্রকৃত অভিজ্ঞতা এবং আপনার মতামত যোগ করুন'
              : 'Verified buyer feedback and star ratings for this organic harvest'}
          </p>
        </div>

        {/* Live Aggregate Rating Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#f5fbf4] dark:bg-[#122418] border border-emerald-200 dark:border-emerald-800/70">
          <div className="text-2xl font-extrabold text-[#097F00] dark:text-emerald-400 tabular-nums leading-none">
            {reviewStats.avgRating.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(reviewStats.avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300 dark:text-stone-600'
                  }`}
                />
              ))}
            </div>
            <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 tabular-nums mt-0.5">
              {language === 'bn'
                ? `${reviewStats.totalCount} টি যাচাইকৃত রিভিউ`
                : `Based on ${reviewStats.totalCount} reviews`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Reviews Layout: Left = Write a Review Form, Right = Customer Reviews List */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols on lg): Leave a Star Rating & Review Form */}
        <div className="lg:col-span-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            {language === 'bn' ? 'আপনার রিভিউ ও রেটিং দিন' : 'Leave a Review & Star Rating'}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {language === 'bn'
              ? 'আপনার রেটিং নির্বাচন করুন এবং পণ্যের মান সম্পর্কে মতামত লিখুন'
              : 'Select a star rating and share your feedback on this product'}
          </p>

          <form onSubmit={handleSubmitReview} className="mt-4 space-y-4" noValidate>
            {/* Interactive 1-5 Star Selector */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                {language === 'bn' ? 'আপনার রেটিং (Your Rating) *' : 'Your Star Rating *'}
              </label>
              <div
                role="radiogroup"
                aria-label={language === 'bn' ? 'স্টার রেটিং নির্বাচন করুন' : 'Select Star Rating'}
                className="flex items-center gap-1"
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= activeStarDisplay;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      role="radio"
                      aria-checked={selectedRating === starValue}
                      aria-label={`${starValue} ${starValue === 1 ? 'Star' : 'Stars'}`}
                      onClick={() => setSelectedRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="min-h-[42px] min-w-[42px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-amber-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 transition-transform ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 scale-110'
                            : 'text-stone-300 dark:text-stone-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 text-xs font-semibold text-[#097F00] dark:text-emerald-400">
                {language === 'bn'
                  ? RATING_LABELS[activeStarDisplay]?.bn
                  : RATING_LABELS[activeStarDisplay]?.en}
              </div>
            </div>

            {/* Reviewer Name & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="review-author-name"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
                </label>
                <input
                  id="review-author-name"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'e.g., Tanvir Ahmed'}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#097F00]"
                />
              </div>

              <div>
                <label
                  htmlFor="review-location"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  {language === 'bn' ? 'জেলা / শহর' : 'City / District'}
                </label>
                <input
                  id="review-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={language === 'bn' ? 'সাতক্ষীরা / ঢাকা' : 'Satkhira / Dhaka'}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#097F00]"
                />
              </div>
            </div>

            {/* Pack Variant Purchased */}
            <div>
              <label
                htmlFor="review-variant"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
              >
                {language === 'bn' ? 'ক্রয়কৃত প্যাক সাইজ' : 'Pack Size Purchased'}
              </label>
              <select
                id="review-variant"
                value={selectedVariantLabel}
                onChange={(e) => setSelectedVariantLabel(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.labelEn}>
                    {language === 'bn' ? v.labelBn : v.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Feedback Input */}
            <div>
              <label
                htmlFor="review-comment-input"
                className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
              >
                {language === 'bn' ? 'আপনার মতামত লিখুন *' : 'Your Feedback *'}
              </label>
              <textarea
                id="review-comment-input"
                rows={3}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={
                  language === 'bn'
                    ? 'পণ্যের স্বাদ, বিশুদ্ধতা এবং প্যাকেজিং সম্পর্কে আপনার অভিজ্ঞতা লিখুন...'
                    : 'Share your experience with product purity, taste, and packaging...'
                }
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#097F00]"
              />
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-semibold text-red-600 dark:text-red-400">
                {errorMsg}
              </p>
            )}

            {submittedSuccess && (
              <div
                role="status"
                className="p-2.5 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/80 border border-[#097F00]/40 text-[#097F00] dark:text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'ধন্যবাদ! আপনার রিভিউ এবং রেটিং সফলভাবে যুক্ত হয়েছে।'
                    : 'Thank you! Your review and star rating have been published.'}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#097F00] hover:bg-[#076300] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'রিভিউ সাবমিট করুন' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Right Column (7 cols on lg): Star Filter + Customer Review Feed */}
        <div className="lg:col-span-7 space-y-4">
          {/* Star Rating Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {language === 'bn'
                ? `গ্রাহকদের মতামত (${displayedReviews.length})`
                : `Verified Customer Feedback (${displayedReviews.length})`}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStar('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                  filterStar === 'all'
                    ? 'bg-[#097F00] text-white border-[#097F00]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}
              >
                {language === 'bn' ? 'সব' : 'All'} ({allProductReviews.length})
              </button>
              {[5, 4, 3].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterStar(star)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    filterStar === star
                      ? 'bg-[#097F00] text-white border-[#097F00]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                  }`}
                >
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="opacity-75">({reviewStats.starCounts[star] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review Cards List */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {displayedReviews.length === 0 ? (
              <div className="p-6 rounded-lg border border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
                {language === 'bn'
                  ? 'এই স্টার ফিল্টারে কোনো রিভিউ পাওয়া যায়নি।'
                  : 'No reviews match this star filter yet.'}
              </div>
            ) : (
              displayedReviews.map((rev) => {
                const hasVoted = helpfulVotedIds.includes(rev.id);
                const displayHelpful =
                  rev.helpfulCount +
                  (hasVoted && rev.id.startsWith('seed-') ? 1 : 0);

                return (
                  <article
                    key={rev.id}
                    className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {rev.authorName}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            · {rev.location}
                          </span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#097F00] dark:text-emerald-400">
                              <UserCheck className="w-3 h-3" />
                              {language === 'bn' ? 'যাচাইকৃত ক্রেতা' : 'Verified Buyer'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {rev.variantLabel} · {rev.createdAt}
                        </div>
                      </div>

                      {/* Star Rating Display */}
                      <div
                        className="flex items-center gap-0.5"
                        aria-label={`${rev.rating} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-[var(--text-primary)] leading-relaxed">
                      {language === 'bn' ? rev.commentBn : rev.commentEn}
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleHelpfulClick(rev.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                          hasVoted
                            ? 'border-[#097F00] text-[#097F00] dark:text-emerald-400 bg-[#f5fbf4] dark:bg-emerald-950/50'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#097F00]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>
                          {language === 'bn' ? 'উপকারী' : 'Helpful'} ({displayHelpful})
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
