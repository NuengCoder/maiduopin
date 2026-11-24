import type {
  Address,
  BargainInstance,
  CartItem,
  CheckoutInput,
  CheckoutPreview,
  Coupon,
  CouponStatus,
  FlashSession,
  GroupInstance,
  GroupMember,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductCard,
  ProductQuery,
  ReferralData,
  User,
} from '../types/models'
import { BANNERS, CATEGORIES, COUPON_SEEDS, HOT_KEYWORDS, PRODUCTS } from '../mock/data'
import { STORAGE_KEYS, readStorage, writeStorage } from './storage'
import { fenToYuan, formatDate, orderNo, uid, yuanToFen } from '../utils/money'

interface CouponClaim {
  claimId: string
  couponId: string
  status: CouponStatus
  orderId?: string
}

const DEFAULT_USER: User = {
  id: 'u_me',
  nickname: '卖多品用户',
  avatarUrl: '',
  avatarText: '卖',
  inviteCode: 'MDP8K2',
  phone: '13800008888',
}

export const CURRENT_USER_ID = DEFAULT_USER.id

const DEFAULT_ADDRESS: Address = {
  id: 'addr_default',
  receiver: '张三',
  phone: '13800008888',
  region: '广东省 深圳市 南山区',
  detail: '科技园南路 88 号 3 栋 1201',
  isDefault: true,
}

const VIRTUAL_NAMES = ['小美', '阿强', '乐乐', '小宇', '团团', '果果']

const wait = (ms = 80): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const readCartRaw = (): CartItem[] => readStorage<CartItem[]>(STORAGE_KEYS.cart, [])

const writeCartRaw = (items: CartItem[]): void => writeStorage(STORAGE_KEYS.cart, items)

const readOrdersRaw = (): Order[] => readStorage<Order[]>(STORAGE_KEYS.orders, [])

const writeOrdersRaw = (orders: Order[]): void => writeStorage(STORAGE_KEYS.orders, orders)

const readGroupsRaw = (): GroupInstance[] => readStorage<GroupInstance[]>(STORAGE_KEYS.groups, [])

const writeGroupsRaw = (groups: GroupInstance[]): void => writeStorage(STORAGE_KEYS.groups, groups)

const readBargainsRaw = (): BargainInstance[] =>
  readStorage<BargainInstance[]>(STORAGE_KEYS.bargains, [])

const writeBargainsRaw = (bargains: BargainInstance[]): void =>
  writeStorage(STORAGE_KEYS.bargains, bargains)

const readCouponClaims = (): CouponClaim[] =>
  readStorage<CouponClaim[]>(STORAGE_KEYS.coupons, [])

const writeCouponClaims = (claims: CouponClaim[]): void =>
  writeStorage(STORAGE_KEYS.coupons, claims)

const findProduct = (productId: string): Product | undefined =>
  PRODUCTS.find((product) => product.id === productId)

type HeavyProductFields = 'images' | 'skus' | 'reviews' | 'description'

/**
 * Strips the fields only the detail page needs. Lists render covers from
 * `image` alone, so shipping `images` (three data URIs), the SKU table and the
 * review copy is pure bridge overhead - that is what made the feed feel slow.
 */
const toCard = (product: Product): ProductCard => {
  const card = { ...product } as ProductCard & Partial<Pick<Product, HeavyProductFields>>
  delete card.images
  delete card.skus
  delete card.reviews
  delete card.description
  return card
}

const findSku = (product: Product, skuId: string) =>
  product.skus.find((sku) => sku.id === skuId) || product.skus[0]

const findAddress = (addressId?: string): Address | undefined => {
  const addresses = readStorage<Address[]>(STORAGE_KEYS.addresses, [])
  if (addressId) {
    const found = addresses.find((address) => address.id === addressId)
    if (found) {
      return found
    }
  }
  return addresses.find((address) => address.isDefault) || addresses[0]
}

const findCouponSeed = (couponId: string) => COUPON_SEEDS.find((coupon) => coupon.id === couponId)

const mapCoupon = (
  seed: (typeof COUPON_SEEDS)[number],
  claim?: CouponClaim,
): Coupon => {
  const amountFen = yuanToFen(seed.amount)
  const thresholdFen = yuanToFen(seed.threshold)
  return {
    id: seed.id,
    claimId: claim?.claimId,
    title: seed.title,
    subtitle: seed.subtitle,
    amountFen,
    amountText: String(seed.amount),
    thresholdFen,
    thresholdText: `满${seed.threshold}元可用`,
    validText: seed.validText,
    status: claim?.status || 'AVAILABLE',
    claimed: Boolean(claim),
  }
}

const statusMeta: Record<OrderStatus, { text: string; hint: string }> = {
  PENDING_PAYMENT: { text: '待付款', hint: '请尽快完成支付，超时订单将自动取消' },
  PAID: { text: '待发货', hint: '商家正在准备您的商品' },
  TO_SHIP: { text: '待发货', hint: '商家正在准备您的商品' },
  SHIPPED: { text: '待收货', hint: '商品已发出，请注意查收' },
  COMPLETED: { text: '已完成', hint: '感谢您的购买，欢迎再次光临' },
  CANCELLED: { text: '已取消', hint: '订单已取消' },
  REFUNDED: { text: '已退款', hint: '退款已原路返回' },
}

const decorateOrder = (order: Order): Order => {
  const meta = statusMeta[order.status]
  const items = order.items.map((item) => {
    const lineTotalFen = item.unitPriceFen * item.quantity
    return {
      ...item,
      unitPriceText: fenToYuan(item.unitPriceFen),
      lineTotalFen,
      lineTotalText: fenToYuan(lineTotalFen),
    }
  })
  return {
    ...order,
    statusText: meta.text,
    statusHint: meta.hint,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalText: fenToYuan(order.totalFen),
    discountText: fenToYuan(order.discountFen),
    shippingText: fenToYuan(order.shippingFen),
    payText: fenToYuan(order.payFen),
    createdText: formatDate(order.createdAt),
  }
}

const buildSeedOrder = (): Order => {
  const product = findProduct('p2') || PRODUCTS[0]
  const sku = product.skus[0]
  const unitPriceFen = product.priceFen
  const createdAt = Date.now() - 3 * 24 * 60 * 60 * 1000
  const order: Order = {
    id: 'ord_seed_1',
    orderNo: 'MDP202611180001',
    status: 'COMPLETED',
    statusText: '',
    statusHint: '',
    items: [
      {
        productId: product.id,
        skuId: sku.id,
        title: product.title,
        image: product.image,
        coverEmoji: product.coverEmoji,
        specName: sku.name,
        unitPriceFen,
        unitPriceText: fenToYuan(unitPriceFen),
        quantity: 1,
        lineTotalFen: unitPriceFen,
        lineTotalText: fenToYuan(unitPriceFen),
      },
    ],
    itemCount: 1,
    totalFen: unitPriceFen,
    totalText: fenToYuan(unitPriceFen),
    discountFen: 0,
    discountText: '0.00',
    shippingFen: 0,
    shippingText: '0.00',
    payFen: unitPriceFen,
    payText: fenToYuan(unitPriceFen),
    createdAt,
    createdText: formatDate(createdAt),
    address: DEFAULT_ADDRESS,
    paidAt: createdAt + 5 * 60 * 1000,
  }
  return decorateOrder(order)
}

export const ensureSeed = (): void => {
  if (readStorage(STORAGE_KEYS.seeded, false)) {
    return
  }
  writeStorage(STORAGE_KEYS.user, DEFAULT_USER)
  writeStorage(STORAGE_KEYS.addresses, [DEFAULT_ADDRESS])
  writeStorage(STORAGE_KEYS.coupons, [
    { claimId: 'cc_new_1', couponId: 'cp1', status: 'AVAILABLE' },
  ])
  writeStorage(STORAGE_KEYS.orders, [buildSeedOrder()])
  writeStorage(STORAGE_KEYS.favorites, [])
  writeStorage(STORAGE_KEYS.groups, [])
  writeStorage(STORAGE_KEYS.bargains, [])
  writeStorage(STORAGE_KEYS.seeded, true)
}

const normalizeCart = (): CartItem[] => {
  const raw = readCartRaw()
  const normalized: CartItem[] = []
  raw.forEach((item) => {
    const product = findProduct(item.productId)
    if (!product) {
      return
    }
    const sku = findSku(product, item.skuId)
    if (!sku) {
      return
    }
    normalized.push({
      ...item,
      title: product.title,
      image: product.image,
      coverEmoji: product.coverEmoji,
      specName: sku.name,
      unitPriceFen: sku.priceFen,
      unitPriceText: fenToYuan(sku.priceFen),
      stock: sku.stock,
      quantity: Math.max(1, Math.min(item.quantity, sku.stock)),
    })
  })
  if (normalized.length !== raw.length) {
    writeCartRaw(normalized)
  }
  return normalized
}

const getGroupRaw = (groupId: string): GroupInstance | undefined => {
  const groups = readGroupsRaw()
  const group = groups.find((item) => item.id === groupId)
  if (!group) {
    return undefined
  }
  if (group.status === 'FORMING' && group.expiresAt <= Date.now()) {
    group.status = 'FAILED'
    writeGroupsRaw(groups)
  }
  return group
}

const getBargainRaw = (bargainId: string): BargainInstance | undefined => {
  const bargains = readBargainsRaw()
  const bargain = bargains.find((item) => item.id === bargainId)
  if (!bargain) {
    return undefined
  }
  if (bargain.status !== 'ORDERED' && bargain.expiresAt <= Date.now()) {
    bargain.status = 'EXPIRED'
    writeBargainsRaw(bargains)
  } else if (bargain.status === 'ACTIVE' && bargain.currentPriceFen <= bargain.floorPriceFen) {
    bargain.status = 'READY'
    writeBargainsRaw(bargains)
  }
  return bargain
}

const currentMember = (group: GroupInstance): GroupMember | undefined =>
  group.members.find((member) => member.id === DEFAULT_USER.id)

const addMemberToGroup = (group: GroupInstance, member: GroupMember): void => {
  if (!group.members.some((item) => item.id === member.id)) {
    group.members.push(member)
  }
}

const removeUnpaidCurrentMember = (groupId: string): void => {
  const groups = readGroupsRaw()
  const group = groups.find((item) => item.id === groupId)
  if (!group || group.status !== 'FORMING') {
    return
  }
  group.members = group.members.filter(
    (member) => !(member.id === DEFAULT_USER.id && !member.paid),
  )
  writeGroupsRaw(groups)
}

const resolveCheckoutItems = (input: CheckoutInput): OrderItem[] => {
  if (input.source === 'cart') {
    const items = normalizeCart().filter((item) => item.selected)
    if (!items.length) {
      throw new Error('请选择要结算的商品')
    }
    return items.map((item) => {
      const lineTotalFen = item.unitPriceFen * item.quantity
      return {
        productId: item.productId,
        skuId: item.skuId,
        title: item.title,
        image: item.image,
        coverEmoji: item.coverEmoji,
        specName: item.specName,
        unitPriceFen: item.unitPriceFen,
        unitPriceText: fenToYuan(item.unitPriceFen),
        quantity: item.quantity,
        lineTotalFen,
        lineTotalText: fenToYuan(lineTotalFen),
      }
    })
  }

  let productId = input.productId
  let skuId = input.skuId
  let activityType: OrderItem['activityType']
  let unitPriceFen: number | undefined

  if (input.source === 'group') {
    if (!input.groupId) {
      throw new Error('拼团信息不存在')
    }
    const group = getGroupRaw(input.groupId)
    if (!group) {
      throw new Error('拼团不存在')
    }
    productId = group.productId
    skuId = group.skuId
    activityType = 'group'
    unitPriceFen = findProduct(productId)?.groupPriceFen
  } else if (input.source === 'bargain') {
    if (!input.bargainId) {
      throw new Error('砍价信息不存在')
    }
    const bargain = getBargainRaw(input.bargainId)
    if (!bargain) {
      throw new Error('砍价活动不存在')
    }
    if (bargain.status !== 'ACTIVE' && bargain.status !== 'READY') {
      throw new Error('砍价已结束')
    }
    productId = bargain.productId
    skuId = bargain.skuId
    activityType = 'bargain'
    unitPriceFen = bargain.currentPriceFen
  } else if (input.source === 'flash') {
    activityType = 'flash'
    const product = productId ? findProduct(productId) : undefined
    unitPriceFen = product?.flashPriceFen
  }

  if (!productId || !skuId) {
    throw new Error('商品信息不存在')
  }

  const product = findProduct(productId)
  if (!product) {
    throw new Error('商品已下架')
  }
  const sku = findSku(product, skuId)
  if (!sku) {
    throw new Error('规格不存在')
  }

  const price = unitPriceFen ?? sku.priceFen
  const quantity = Math.max(1, Math.min(input.quantity || 1, sku.stock))
  const lineTotalFen = price * quantity

  return [
    {
      productId: product.id,
      skuId: sku.id,
      title: product.title,
      image: product.image,
      coverEmoji: product.coverEmoji,
      specName: sku.name,
      unitPriceFen: price,
      unitPriceText: fenToYuan(price),
      quantity,
      lineTotalFen,
      lineTotalText: fenToYuan(lineTotalFen),
      activityType,
    },
  ]
}

const pickCoupon = (subtotalFen: number, claimId?: string): Coupon | undefined => {
  const claims = readCouponClaims().filter((claim) => claim.status === 'AVAILABLE')
  const coupons = claims
    .map((claim) => {
      const seed = findCouponSeed(claim.couponId)
      return seed ? mapCoupon(seed, claim) : undefined
    })
    .filter((coupon): coupon is Coupon => Boolean(coupon))

  if (claimId) {
    const selected = coupons.find((coupon) => coupon.claimId === claimId)
    if (selected && selected.thresholdFen <= subtotalFen) {
      return selected
    }
  }

  return coupons
    .filter((coupon) => coupon.thresholdFen <= subtotalFen)
    .sort((a, b) => b.amountFen - a.amountFen)[0]
}

const releaseCoupon = (orderId: string): void => {
  const claims = readCouponClaims()
  let changed = false
  claims.forEach((claim) => {
    if (claim.orderId === orderId && claim.status === 'LOCKED') {
      claim.status = 'AVAILABLE'
      delete claim.orderId
      changed = true
    }
  })
  if (changed) {
    writeCouponClaims(claims)
  }
}

export const getMe = async (): Promise<User> => {
  ensureSeed()
  await wait(30)
  return clone(readStorage<User>(STORAGE_KEYS.user, DEFAULT_USER))
}

export const updateMe = async (input: Partial<Pick<User, 'nickname' | 'avatarUrl'>>): Promise<User> => {
  ensureSeed()
  const user = readStorage<User>(STORAGE_KEYS.user, DEFAULT_USER)
  const next = { ...user, ...input }
  writeStorage(STORAGE_KEYS.user, next)
  await wait(20)
  return clone(next)
}

export const getHome = async (): Promise<{
  banners: typeof BANNERS
  categories: typeof CATEGORIES
  flashProducts: ProductCard[]
  groupProducts: ProductCard[]
  feed: ProductCard[]
}> => {
  ensureSeed()
  await wait(60)
  return {
    banners: BANNERS,
    categories: CATEGORIES,
    flashProducts: PRODUCTS.filter((product) => product.flashPriceFen).map(toCard),
    groupProducts: PRODUCTS.filter((product) => product.groupPriceFen).slice(0, 6).map(toCard),
    feed: [...PRODUCTS].sort((a, b) => b.sales - a.sales).map(toCard),
  }
}

export const getCategories = async (): Promise<typeof CATEGORIES> => {
  await wait(20)
  return CATEGORIES
}

export const getSearchHot = async (): Promise<string[]> => {
  await wait(20)
  return HOT_KEYWORDS
}

export const getProducts = async (query: ProductQuery = {}): Promise<ProductCard[]> => {
  await wait(40)
  let result = [...PRODUCTS]
  if (query.categoryId) {
    result = result.filter((product) => product.categoryId === query.categoryId)
  }
  if (query.keyword) {
    const keyword = query.keyword.trim().toLowerCase()
    result = result.filter((product) =>
      [product.title, product.subtitle, ...product.tags]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }
  if (query.sort === 'sales') {
    result.sort((a, b) => b.sales - a.sales)
  } else if (query.sort === 'price_asc') {
    result.sort((a, b) => a.priceFen - b.priceFen)
  } else if (query.sort === 'price_desc') {
    result.sort((a, b) => b.priceFen - a.priceFen)
  }
  return result.map(toCard)
}

export const getProduct = async (productId: string): Promise<Product> => {
  ensureSeed()
  await wait(50)
  const product = findProduct(productId)
  if (!product) {
    throw new Error('商品不存在或已下架')
  }
  return clone(product)
}

export const getCart = async (): Promise<CartItem[]> => {
  ensureSeed()
  await wait(40)
  return clone(normalizeCart())
}

export const getCartCount = (): number =>
  normalizeCart().reduce((sum, item) => sum + item.quantity, 0)

export const addToCart = async (
  productId: string,
  skuId: string,
  quantity = 1,
): Promise<CartItem[]> => {
  ensureSeed()
  const product = findProduct(productId)
  if (!product) {
    throw new Error('商品不存在')
  }
  const sku = findSku(product, skuId)
  if (!sku) {
    throw new Error('规格不存在')
  }
  const items = normalizeCart()
  const existing = items.find((item) => item.productId === productId && item.skuId === skuId)
  if (existing) {
    existing.quantity = Math.min(existing.stock, existing.quantity + quantity)
    existing.selected = true
  } else {
    items.push({
      id: uid('ci'),
      productId,
      skuId,
      title: product.title,
      image: product.image,
      coverEmoji: product.coverEmoji,
      specName: sku.name,
      unitPriceFen: sku.priceFen,
      unitPriceText: fenToYuan(sku.priceFen),
      quantity: Math.min(quantity, sku.stock),
      selected: true,
      stock: sku.stock,
    })
  }
  writeCartRaw(items)
  await wait(30)
  return clone(items)
}

export const updateCartItem = async (
  id: string,
  patch: { quantity?: number; selected?: boolean },
): Promise<CartItem[]> => {
  const items = normalizeCart()
  const item = items.find((entry) => entry.id === id)
  if (item) {
    if (typeof patch.selected === 'boolean') {
      item.selected = patch.selected
    }
    if (typeof patch.quantity === 'number') {
      item.quantity = Math.max(1, Math.min(patch.quantity, item.stock))
    }
    writeCartRaw(items)
  }
  await wait(20)
  return clone(items)
}

export const toggleAllCart = async (selected: boolean): Promise<CartItem[]> => {
  const items = normalizeCart()
  items.forEach((item) => {
    item.selected = selected
  })
  writeCartRaw(items)
  await wait(20)
  return clone(items)
}

export const removeCartItem = async (id: string): Promise<CartItem[]> => {
  const items = normalizeCart().filter((item) => item.id !== id)
  writeCartRaw(items)
  await wait(20)
  return clone(items)
}

export const getAddresses = async (): Promise<Address[]> => {
  ensureSeed()
  await wait(30)
  return clone(readStorage<Address[]>(STORAGE_KEYS.addresses, []))
}

export const saveAddress = async (
  input: Omit<Address, 'id'> & { id?: string },
): Promise<Address[]> => {
  ensureSeed()
  const addresses = readStorage<Address[]>(STORAGE_KEYS.addresses, [])
  const isFirst = addresses.length === 0
  const next: Address = {
    id: input.id || uid('addr'),
    receiver: input.receiver,
    phone: input.phone,
    region: input.region,
    detail: input.detail,
    isDefault: input.isDefault || isFirst,
  }
  const index = addresses.findIndex((address) => address.id === next.id)
  if (index >= 0) {
    addresses[index] = next
  } else {
    addresses.unshift(next)
  }
  if (next.isDefault) {
    addresses.forEach((address) => {
      address.isDefault = address.id === next.id
    })
  }
  writeStorage(STORAGE_KEYS.addresses, addresses)
  await wait(30)
  return clone(addresses)
}

export const deleteAddress = async (id: string): Promise<Address[]> => {
  const addresses = readStorage<Address[]>(STORAGE_KEYS.addresses, []).filter(
    (address) => address.id !== id,
  )
  if (addresses.length && !addresses.some((address) => address.isDefault)) {
    addresses[0].isDefault = true
  }
  writeStorage(STORAGE_KEYS.addresses, addresses)
  await wait(20)
  return clone(addresses)
}

export const selectAddress = (id: string): void => {
  writeStorage(STORAGE_KEYS.selectedAddress, id)
}

export const getSelectedAddress = (): Address | undefined => {
  const id = readStorage<string>(STORAGE_KEYS.selectedAddress, '')
  return findAddress(id || undefined)
}

export const getCoupons = async (): Promise<Coupon[]> => {
  ensureSeed()
  await wait(40)
  const claims = readCouponClaims()
  return COUPON_SEEDS.map((seed) =>
    mapCoupon(
      seed,
      claims.find((claim) => claim.couponId === seed.id && claim.status !== 'EXPIRED'),
    ),
  )
}

export const getMyCoupons = async (): Promise<Coupon[]> => {
  ensureSeed()
  await wait(30)
  return readCouponClaims()
    .map((claim) => {
      const seed = findCouponSeed(claim.couponId)
      return seed ? mapCoupon(seed, claim) : undefined
    })
    .filter((coupon): coupon is Coupon => Boolean(coupon))
}

export const claimCoupon = async (couponId: string): Promise<Coupon[]> => {
  ensureSeed()
  const seed = findCouponSeed(couponId)
  if (!seed) {
    throw new Error('优惠券不存在')
  }
  const claims = readCouponClaims()
  if (!claims.some((claim) => claim.couponId === couponId)) {
    claims.unshift({
      claimId: uid('cc'),
      couponId,
      status: 'AVAILABLE',
    })
    writeCouponClaims(claims)
  }
  await wait(30)
  return getCoupons()
}

export const getCheckoutPreview = async (input: CheckoutInput): Promise<CheckoutPreview> => {
  ensureSeed()
  await wait(50)
  const items = resolveCheckoutItems(input)
  const subtotalFen = items.reduce((sum, item) => sum + item.unitPriceFen * item.quantity, 0)
  const coupon = pickCoupon(subtotalFen, input.couponClaimId)
  const discountFen = coupon ? coupon.amountFen : 0
  const shippingFen = subtotalFen >= 9900 ? 0 : 800
  const payFen = Math.max(0, subtotalFen - discountFen + shippingFen)
  const address = input.addressId ? findAddress(input.addressId) : getSelectedAddress()
  const claims = readCouponClaims().filter((claim) => claim.status === 'AVAILABLE')
  const availableCoupons = claims
    .map((claim) => {
      const seed = findCouponSeed(claim.couponId)
      return seed ? mapCoupon(seed, claim) : undefined
    })
    .filter((entry): entry is Coupon => Boolean(entry))

  return {
    items,
    subtotalFen,
    subtotalText: fenToYuan(subtotalFen),
    discountFen,
    discountText: fenToYuan(discountFen),
    shippingFen,
    shippingText: shippingFen === 0 ? '免运费' : fenToYuan(shippingFen),
    payFen,
    payText: fenToYuan(payFen),
    address,
    coupon,
    availableCoupons,
  }
}

const lockCoupon = (claimId: string | undefined, orderId: string): void => {
  if (!claimId) {
    return
  }
  const claims = readCouponClaims()
  const claim = claims.find((entry) => entry.claimId === claimId)
  if (claim && claim.status === 'AVAILABLE') {
    claim.status = 'LOCKED'
    claim.orderId = orderId
    writeCouponClaims(claims)
  }
}

export const createOrder = async (input: CheckoutInput): Promise<Order> => {
  ensureSeed()
  const preview = await getCheckoutPreview(input)
  if (!preview.items.length) {
    throw new Error('订单中没有商品')
  }
  if (!preview.address) {
    throw new Error('请先选择收货地址')
  }

  if (input.source === 'group') {
    if (!input.groupId) {
      throw new Error('拼团信息不存在')
    }
    const group = getGroupRaw(input.groupId)
    if (!group || group.status !== 'FORMING') {
      throw new Error('该拼团已结束')
    }
    if (!currentMember(group)) {
      if (group.members.length >= group.requiredCount) {
        throw new Error('该拼团人数已满')
      }
      addMemberToGroup(group, {
        id: DEFAULT_USER.id,
        name: '我',
        avatarText: '我',
        paid: false,
      })
      writeGroupsRaw(readGroupsRaw().map((item) => (item.id === group.id ? group : item)))
    }
  }

  if (input.source === 'bargain') {
    if (!input.bargainId) {
      throw new Error('砍价信息不存在')
    }
    const bargain = getBargainRaw(input.bargainId)
    if (!bargain || (bargain.status !== 'ACTIVE' && bargain.status !== 'READY')) {
      throw new Error('砍价已结束')
    }
  }

  const now = Date.now()
  const order: Order = {
    id: uid('ord'),
    orderNo: orderNo(),
    status: 'PENDING_PAYMENT',
    statusText: '',
    statusHint: '',
    items: preview.items,
    itemCount: preview.items.reduce((sum, item) => sum + item.quantity, 0),
    totalFen: preview.subtotalFen,
    totalText: preview.subtotalText,
    discountFen: preview.discountFen,
    discountText: preview.discountText,
    shippingFen: preview.shippingFen,
    shippingText: preview.shippingText,
    payFen: preview.payFen,
    payText: preview.payText,
    createdAt: now,
    createdText: formatDate(now),
    address: preview.address,
    couponTitle: preview.coupon?.title,
    groupId: input.groupId,
    bargainId: input.bargainId,
  }

  const orders = readOrdersRaw()
  orders.unshift(decorateOrder(order))
  writeOrdersRaw(orders)
  lockCoupon(preview.coupon?.claimId, order.id)

  if (input.source === 'cart') {
    const cart = normalizeCart()
    const selectedKeys = new Set(
      preview.items.map((item) => `${item.productId}::${item.skuId}`),
    )
    writeCartRaw(
      cart.filter((item) => !selectedKeys.has(`${item.productId}::${item.skuId}`)),
    )
  }

  await wait(60)
  return clone(decorateOrder(order))
}

export const getOrders = async (status?: OrderStatus | 'ALL'): Promise<Order[]> => {
  ensureSeed()
  await wait(40)
  const orders = readOrdersRaw()
    .map(decorateOrder)
    .filter((order) => !status || status === 'ALL' || order.status === status)
    .sort((a, b) => b.createdAt - a.createdAt)
  return clone(orders)
}

export const getOrder = async (orderId: string): Promise<Order> => {
  ensureSeed()
  await wait(30)
  const order = readOrdersRaw().find((item) => item.id === orderId)
  if (!order) {
    throw new Error('订单不存在')
  }
  return clone(decorateOrder(order))
}

export const mockPay = async (orderId: string): Promise<Order> => {
  const orders = readOrdersRaw()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index < 0) {
    throw new Error('订单不存在')
  }
  const order = orders[index]
  if (order.status !== 'PENDING_PAYMENT') {
    return clone(decorateOrder(order))
  }
  order.status = 'PAID'
  order.paidAt = Date.now()

  const claims = readCouponClaims()
  claims.forEach((claim) => {
    if (claim.orderId === orderId) {
      claim.status = 'USED'
    }
  })
  writeCouponClaims(claims)

  if (order.groupId) {
    const groups = readGroupsRaw()
    const group = groups.find((item) => item.id === order.groupId)
    if (group) {
      const member = currentMember(group)
      if (member) {
        member.paid = true
      }
      group.orderId = orderId
      const paidCount = group.members.filter((entry) => entry.paid).length
      if (paidCount >= group.requiredCount) {
        group.status = 'SUCCESS'
      }
      writeGroupsRaw(groups)
    }
  }

  if (order.bargainId) {
    const bargains = readBargainsRaw()
    const bargain = bargains.find((item) => item.id === order.bargainId)
    if (bargain) {
      bargain.status = 'ORDERED'
      bargain.orderId = orderId
      writeBargainsRaw(bargains)
    }
  }

  orders[index] = decorateOrder(order)
  writeOrdersRaw(orders)
  await wait(80)
  return clone(decorateOrder(order))
}

export const cancelOrder = async (orderId: string): Promise<Order> => {
  const orders = readOrdersRaw()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index < 0) {
    throw new Error('订单不存在')
  }
  const order = orders[index]
  if (order.status !== 'PENDING_PAYMENT') {
    throw new Error('当前订单不可取消')
  }
  order.status = 'CANCELLED'
  orders[index] = decorateOrder(order)
  writeOrdersRaw(orders)
  releaseCoupon(orderId)
  if (order.groupId) {
    removeUnpaidCurrentMember(order.groupId)
  }
  await wait(40)
  return clone(orders[index])
}

export const confirmOrder = async (orderId: string): Promise<Order> => {
  const orders = readOrdersRaw()
  const index = orders.findIndex((order) => order.id === orderId)
  if (index < 0) {
    throw new Error('订单不存在')
  }
  const order = orders[index]
  if (order.status !== 'SHIPPED' && order.status !== 'PAID') {
    throw new Error('当前订单不可确认收货')
  }
  order.status = 'COMPLETED'
  orders[index] = decorateOrder(order)
  writeOrdersRaw(orders)
  await wait(40)
  return clone(orders[index])
}

export const getFavorites = async (): Promise<ProductCard[]> => {
  ensureSeed()
  await wait(30)
  const ids = readStorage<string[]>(STORAGE_KEYS.favorites, [])
  return clone(
    ids
      .map((id) => findProduct(id))
      .filter((product): product is Product => Boolean(product))
      .map(toCard),
  )
}

export const isFavorite = (productId: string): boolean =>
  readStorage<string[]>(STORAGE_KEYS.favorites, []).includes(productId)

export const toggleFavorite = async (productId: string): Promise<boolean> => {
  ensureSeed()
  const ids = readStorage<string[]>(STORAGE_KEYS.favorites, [])
  const index = ids.indexOf(productId)
  if (index >= 0) {
    ids.splice(index, 1)
  } else {
    ids.unshift(productId)
  }
  writeStorage(STORAGE_KEYS.favorites, ids)
  await wait(20)
  return index < 0
}

export const createGroup = async (productId: string, skuId: string): Promise<GroupInstance> => {
  ensureSeed()
  const product = findProduct(productId)
  if (!product || !product.groupPriceFen) {
    throw new Error('该商品暂不支持拼团')
  }
  const group: GroupInstance = {
    id: uid('grp'),
    productId,
    skuId,
    status: 'FORMING',
    requiredCount: product.groupSize || 2,
    members: [
      {
        id: DEFAULT_USER.id,
        name: '我',
        avatarText: '我',
        paid: false,
      },
    ],
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    leaderId: DEFAULT_USER.id,
    createdAt: Date.now(),
  }
  const groups = readGroupsRaw()
  groups.unshift(group)
  writeGroupsRaw(groups)
  await wait(50)
  return clone(group)
}

export const getGroup = async (groupId: string): Promise<GroupInstance> => {
  ensureSeed()
  const group = getGroupRaw(groupId)
  if (!group) {
    throw new Error('拼团不存在')
  }
  await wait(20)
  return clone(group)
}

export const getMyGroups = async (): Promise<GroupInstance[]> => {
  ensureSeed()
  await wait(30)
  return clone(
    readGroupsRaw()
      .filter((group) => group.members.some((member) => member.id === DEFAULT_USER.id))
      .sort((a, b) => b.createdAt - a.createdAt),
  )
}

export const joinGroup = async (groupId: string): Promise<GroupInstance> => {
  ensureSeed()
  const groups = readGroupsRaw()
  const group = groups.find((item) => item.id === groupId)
  if (!group) {
    throw new Error('拼团不存在')
  }
  if (group.status !== 'FORMING') {
    throw new Error('该拼团已结束')
  }
  if (group.members.length >= group.requiredCount) {
    throw new Error('该拼团人数已满')
  }
  addMemberToGroup(group, {
    id: DEFAULT_USER.id,
    name: '我',
    avatarText: '我',
    paid: false,
  })
  writeGroupsRaw(groups)
  await wait(30)
  return clone(group)
}

export const simulateGroupJoin = async (groupId: string): Promise<GroupInstance> => {
  ensureSeed()
  const groups = readGroupsRaw()
  const group = groups.find((item) => item.id === groupId)
  if (!group) {
    throw new Error('拼团不存在')
  }
  if (group.status !== 'FORMING') {
    throw new Error('该拼团已结束')
  }
  if (group.members.length >= group.requiredCount) {
    throw new Error('该拼团人数已满')
  }
  const availableNames = VIRTUAL_NAMES.filter(
    (name) => !group.members.some((member) => member.name === name),
  )
  const name = availableNames[0] || `好友${group.members.length}`
  group.members.push({
    id: `virtual_${Date.now()}`,
    name,
    avatarText: name.slice(0, 1),
    paid: true,
    virtual: true,
  })
  if (group.members.filter((member) => member.paid).length >= group.requiredCount) {
    group.status = 'SUCCESS'
  }
  writeGroupsRaw(groups)
  await wait(40)
  return clone(group)
}

export const createBargain = async (
  productId: string,
  skuId: string,
): Promise<BargainInstance> => {
  ensureSeed()
  const product = findProduct(productId)
  if (!product || !product.bargainStartFen || !product.bargainFloorFen) {
    throw new Error('该商品暂不支持砍价')
  }
  const bargain: BargainInstance = {
    id: uid('bar'),
    productId,
    skuId,
    startPriceFen: product.bargainStartFen,
    startPriceText: fenToYuan(product.bargainStartFen),
    floorPriceFen: product.bargainFloorFen,
    floorPriceText: fenToYuan(product.bargainFloorFen),
    currentPriceFen: product.bargainStartFen,
    currentPriceText: fenToYuan(product.bargainStartFen),
    cuts: [],
    status: 'ACTIVE',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    userId: DEFAULT_USER.id,
  }
  const bargains = readBargainsRaw()
  bargains.unshift(bargain)
  writeBargainsRaw(bargains)
  await wait(50)
  return clone(bargain)
}

export const getBargain = async (bargainId: string): Promise<BargainInstance> => {
  ensureSeed()
  const bargain = getBargainRaw(bargainId)
  if (!bargain) {
    throw new Error('砍价活动不存在')
  }
  await wait(20)
  return clone(bargain)
}

export const cutBargain = async (bargainId: string): Promise<BargainInstance> => {
  ensureSeed()
  const bargains = readBargainsRaw()
  const bargain = bargains.find((item) => item.id === bargainId)
  if (!bargain) {
    throw new Error('砍价活动不存在')
  }
  if (bargain.status !== 'ACTIVE') {
    throw new Error('当前砍价不可继续')
  }
  if (bargain.expiresAt <= Date.now()) {
    bargain.status = 'EXPIRED'
    writeBargainsRaw(bargains)
    throw new Error('砍价已过期')
  }
  const availableNames = VIRTUAL_NAMES.filter(
    (name) => !bargain.cuts.some((cut) => cut.helperName === name),
  )
  if (!availableNames.length) {
    bargain.currentPriceFen = bargain.floorPriceFen
    bargain.currentPriceText = fenToYuan(bargain.floorPriceFen)
    bargain.status = 'READY'
    writeBargainsRaw(bargains)
    await wait(40)
    return clone(bargain)
  }
  const helperName = availableNames[0]
  const gap = bargain.currentPriceFen - bargain.floorPriceFen
  const base = Math.ceil(gap / availableNames.length)
  const jitter = Math.round(base * (0.85 + Math.random() * 0.3))
  const amount = availableNames.length === 1 ? gap : Math.min(gap, Math.max(100, jitter))
  bargain.currentPriceFen = Math.max(bargain.floorPriceFen, bargain.currentPriceFen - amount)
  bargain.currentPriceText = fenToYuan(bargain.currentPriceFen)
  bargain.cuts.unshift({
    id: uid('cut'),
    helperName,
    amountFen: amount,
    amountText: fenToYuan(amount),
    createdAt: Date.now(),
  })
  if (bargain.currentPriceFen <= bargain.floorPriceFen) {
    bargain.status = 'READY'
  }
  writeBargainsRaw(bargains)
  await wait(60)
  return clone(bargain)
}

export const getMyBargains = async (): Promise<BargainInstance[]> => {
  ensureSeed()
  await wait(30)
  return clone(readBargainsRaw().sort((a, b) => b.expiresAt - a.expiresAt))
}

export const getFlashSessions = async (): Promise<FlashSession[]> => {
  ensureSeed()
  await wait(40)
  const now = Date.now()
  const session: FlashSession = {
    id: 'flash_1',
    title: '今日限时秒杀',
    startAt: now - 60 * 60 * 1000,
    endAt: now + 2 * 60 * 60 * 1000,
    status: 'ACTIVE',
    items: PRODUCTS.filter((product) => product.flashPriceFen).map((product) => ({
      product: toCard(product),
      flashPriceFen: product.flashPriceFen || product.priceFen,
      flashPriceText: product.flashPriceText || product.priceText,
      stock: product.flashStock || 50,
      limit: 2,
    })),
  }
  return clone([session])
}

export const getReferralData = async (): Promise<ReferralData> => {
  ensureSeed()
  await wait(30)
  const user = readStorage<User>(STORAGE_KEYS.user, DEFAULT_USER)
  return {
    inviteCode: user.inviteCode,
    invites: 3,
    rewards: 2,
    rewardText: '2张10元无门槛券',
  }
}

export const saveSelectedCategory = (categoryId: string): void => {
  writeStorage(STORAGE_KEYS.selectedCategory, categoryId)
}

export const takeSelectedCategory = (): string => {
  const categoryId = readStorage<string>(STORAGE_KEYS.selectedCategory, '')
  if (categoryId) {
    writeStorage(STORAGE_KEYS.selectedCategory, '')
  }
  return categoryId
}
