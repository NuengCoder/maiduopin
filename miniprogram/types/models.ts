export interface Shop {
  id: string
  name: string
  logo: string
  badge: string
}

export interface Sku {
  id: string
  name: string
  priceFen: number
  stock: number
}

export interface Review {
  id: string
  userName: string
  avatarText: string
  rating: number
  content: string
  date: string
}

export interface Product {
  id: string
  title: string
  subtitle: string
  categoryId: string
  /** Emoji drawn over the cover art so the artwork always matches the product. */
  coverEmoji: string
  /** Palette key for the generated cover gradient. */
  coverTone: string
  image: string
  images: string[]
  priceFen: number
  priceInt: string
  priceDec: string
  priceText: string
  marketPriceFen: number
  marketPriceText: string
  sales: number
  salesText: string
  tags: string[]
  groupPriceFen?: number
  groupPriceText?: string
  groupSize?: number
  bargainStartFen?: number
  bargainStartText?: string
  bargainFloorFen?: number
  bargainFloorText?: string
  flashPriceFen?: number
  flashPriceText?: string
  flashStock?: number
  /** First SKU id - lets list surfaces jump straight to checkout. */
  defaultSkuId: string
  skus: Sku[]
  shop: Shop
  reviews: Review[]
  description: string[]
}

/**
 * Lightweight product projection used by every list surface (home feed,
 * category, search, favourites, flash sale).
 *
 * The heavy fields (`images`, `skus`, `reviews`, `description`) are dropped
 * before `setData` so a 24 item feed does not ship ~200 KB of strings across
 * the logic/view bridge. Only the detail page loads the full `Product`.
 */
export type ProductCard = Omit<Product, 'images' | 'skus' | 'reviews' | 'description'>

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Banner {
  id: string
  image: string
  emoji: string
  title: string
  subtitle: string
  productId?: string
}

export interface HomeData {
  banners: Banner[]
  categories: Category[]
  flashProducts: ProductCard[]
  groupProducts: ProductCard[]
  feed: ProductCard[]
}

export interface CartItem {
  id: string
  productId: string
  skuId: string
  title: string
  image: string
  coverEmoji: string
  specName: string
  unitPriceFen: number
  unitPriceText: string
  quantity: number
  selected: boolean
  stock: number
}

export interface Address {
  id: string
  receiver: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

export type CouponStatus = 'AVAILABLE' | 'CLAIMED' | 'LOCKED' | 'USED' | 'EXPIRED'

export interface Coupon {
  id: string
  claimId?: string
  title: string
  subtitle: string
  amountFen: number
  amountText: string
  thresholdFen: number
  thresholdText: string
  validText: string
  status: CouponStatus
  claimed: boolean
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'TO_SHIP'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export type ActivityType = 'group' | 'bargain' | 'flash'

export interface OrderItem {
  productId: string
  skuId: string
  title: string
  image: string
  coverEmoji: string
  specName: string
  unitPriceFen: number
  unitPriceText: string
  quantity: number
  lineTotalFen: number
  lineTotalText: string
  activityType?: ActivityType
}

export interface Order {
  id: string
  orderNo: string
  status: OrderStatus
  statusText: string
  statusHint: string
  items: OrderItem[]
  itemCount: number
  totalFen: number
  totalText: string
  discountFen: number
  discountText: string
  shippingFen: number
  shippingText: string
  payFen: number
  payText: string
  createdAt: number
  createdText: string
  address?: Address
  couponTitle?: string
  groupId?: string
  bargainId?: string
  paidAt?: number
}

export interface CheckoutPreview {
  items: OrderItem[]
  subtotalFen: number
  subtotalText: string
  discountFen: number
  discountText: string
  shippingFen: number
  shippingText: string
  payFen: number
  payText: string
  address?: Address
  coupon?: Coupon
  availableCoupons: Coupon[]
}

export type CheckoutSource = 'cart' | 'buy' | 'group' | 'bargain' | 'flash'

export interface CheckoutInput {
  source: CheckoutSource
  productId?: string
  skuId?: string
  quantity?: number
  groupId?: string
  bargainId?: string
  addressId?: string
  couponClaimId?: string
}

export interface GroupMember {
  id: string
  name: string
  avatarText: string
  paid: boolean
  virtual?: boolean
}

export interface GroupInstance {
  id: string
  productId: string
  skuId: string
  status: 'FORMING' | 'SUCCESS' | 'FAILED'
  requiredCount: number
  members: GroupMember[]
  expiresAt: number
  leaderId: string
  orderId?: string
  createdAt: number
}

export interface BargainCut {
  id: string
  helperName: string
  amountFen: number
  amountText: string
  createdAt: number
}

export interface BargainInstance {
  id: string
  productId: string
  skuId: string
  startPriceFen: number
  startPriceText: string
  floorPriceFen: number
  floorPriceText: string
  currentPriceFen: number
  currentPriceText: string
  cuts: BargainCut[]
  status: 'ACTIVE' | 'READY' | 'ORDERED' | 'EXPIRED'
  expiresAt: number
  userId: string
  orderId?: string
}

export interface FlashItem {
  product: ProductCard
  flashPriceFen: number
  flashPriceText: string
  stock: number
  limit: number
}

export interface FlashSession {
  id: string
  title: string
  startAt: number
  endAt: number
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED'
  items: FlashItem[]
}

export interface User {
  id: string
  nickname: string
  avatarUrl: string
  avatarText: string
  inviteCode: string
  phone: string
}

export interface ReferralData {
  inviteCode: string
  invites: number
  rewards: number
  rewardText: string
}

export interface ProductQuery {
  categoryId?: string
  keyword?: string
  sort?: 'default' | 'sales' | 'price_asc' | 'price_desc'
}
