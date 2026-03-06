// Stripe product and price configuration
// These IDs come from Stripe Dashboard / API
// Base currency: DKK — 19 kr/month, 182.40 kr/year (20% discount)

export const STRIPE_CONFIG = {
  monthly: {
    productId: 'prod_U3P8dJHhOubMjE',
    priceId: 'price_1T5IKcDOQIZDolTjlzqtyyY9',
    priceDkk: 19,
    interval: 'month' as const,
  },
  yearly: {
    productId: 'prod_U3P8dz1HkgmHSs',
    priceId: 'price_1T5IKdDOQIZDolTjWGDhdfc0',
    priceDkk: 182.40,
    interval: 'year' as const,
  },
  trialDays: 3,
};
