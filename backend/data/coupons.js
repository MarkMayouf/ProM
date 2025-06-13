const coupons = [
  {
    code: 'SUMMER23',
    description: 'Summer Sale 2023 - Extra 10% off on all purchases',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchaseAmount: 100,
    isActive: true,
    validFrom: new Date('2023-06-01'),
    validUntil: new Date('2023-08-31'),
    usageLimitPerCoupon: 1000,
    usageLimitPerUser: 1,
    timesUsed: 0
  },
  {
    code: 'BUNDLE30',
    description: 'Buy 2 suits and get 30% off',
    discountType: 'percentage',
    discountValue: 30,
    minimumPurchaseAmount: 1000,
    isActive: true,
    validFrom: new Date('2023-06-01'),
    validUntil: new Date('2023-08-31'),
    usageLimitPerCoupon: 500,
    usageLimitPerUser: 1,
    timesUsed: 0
  },
  {
    code: 'WEDDING20',
    description: '20% off on wedding collection',
    discountType: 'percentage',
    discountValue: 20,
    minimumPurchaseAmount: 500,
    isActive: true,
    validFrom: new Date('2023-06-01'),
    validUntil: new Date('2023-12-31'),
    usageLimitPerCoupon: 1000,
    usageLimitPerUser: 1,
    timesUsed: 0
  },
  {
    code: 'WELCOME15',
    description: '15% off for first-time customers',
    discountType: 'percentage',
    discountValue: 15,
    minimumPurchaseAmount: 0,
    isActive: true,
    validFrom: new Date('2023-01-01'),
    validUntil: new Date('2023-12-31'),
    usageLimitPerCoupon: null,
    usageLimitPerUser: 1,
    timesUsed: 0
  }
];

export default coupons; 