import type { Banner, Category, Product, Shop } from '../types/models'
import { fenToYuan, formatSales, priceParts, yuanToFen } from '../utils/money'
import { COVERS } from './covers'

/**
 * Product artwork.
 *
 * The demo ships generated gradient covers (see `scripts/gen-covers.js`) so the
 * mini program renders instantly, works offline and never shows a photo that
 * has nothing to do with the product. Each cover is a data URI, so no image
 * domain has to be whitelisted in the WeChat console.
 *
 * When a real CDN exists, set `PHOTO_BASE` to its public URL and every product
 * will use `${PHOTO_BASE}/${productId}.jpg` instead, falling back to the cover
 * whenever that file is missing.
 */
const PHOTO_BASE = ''

const cover = (tone: string, variant = 1): string =>
  COVERS[`${tone}-${variant}`] || COVERS[tone] || COVERS['c5-1']

const productImage = (productId: string, tone: string, variant = 1): string =>
  PHOTO_BASE ? `${PHOTO_BASE}/${productId}.jpg` : cover(tone, variant)

/** Emoji drawn on top of each cover - this is what ties art to product. */
const PRODUCT_EMOJI: Record<string, string> = {
  p1: '🍊',
  p2: '👕',
  p3: '🎧',
  p4: '🥤',
  p5: '☕',
  p6: '🧺',
  p7: '🧥',
  p8: '🧱',
  p9: '🧼',
  p10: '🍳',
  p11: '🫖',
  p12: '👜',
  p13: '🦴',
  p14: '🤸',
  p15: '🍒',
  p16: '🧃',
  p17: '🛁',
  p18: '💡',
  p19: '🩳',
  p20: '🧴',
  p21: '🍎',
  p22: '🧖',
  p23: '🍼',
  p24: '🥜',
}

const EMOJI_BY_CATEGORY: Record<string, string> = {
  c1: '🍊',
  c2: '👕',
  c3: '🎧',
  c4: '💄',
  c5: '🏠',
  c6: '🧸',
  c7: '🏃',
  c8: '☕',
}


export const SHOPS: Shop[] = [
  { id: 'shop_1', name: '卖多品优选', logo: '优', badge: '官方自营' },
  { id: 'shop_2', name: '山野鲜生', logo: '鲜', badge: '产地直发' },
  { id: 'shop_3', name: '好物研究所', logo: '研', badge: '品质严选' },
]

export const CATEGORIES: Category[] = [
  { id: 'c1', name: '生鲜水果', icon: '🍊' },
  { id: 'c2', name: '服饰鞋包', icon: '👕' },
  { id: 'c3', name: '数码家电', icon: '🎧' },
  { id: 'c4', name: '美妆个护', icon: '💄' },
  { id: 'c5', name: '家居百货', icon: '🏠' },
  { id: 'c6', name: '母婴玩具', icon: '🧸' },
  { id: 'c7', name: '运动户外', icon: '🏃' },
  { id: 'c8', name: '食品饮料', icon: '☕' },
]

interface ProductSeed {
  id: string
  categoryId: string
  shopId: string
  title: string
  subtitle: string
  price: number
  market: number
  sales: number
  tags: string[]
  skuNames?: string[]
  groupSize?: number
  groupPrice?: number
  bargainStart?: number
  bargainFloor?: number
  flashPrice?: number
  flashStock?: number
}

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: 'p1',
    categoryId: 'c1',
    shopId: 'shop_2',
    title: '赣南脐橙 5斤装 新鲜现摘',
    subtitle: '果肉饱满，酸甜多汁，产地直发',
    price: 29.9,
    market: 49.9,
    sales: 12600,
    tags: ['产地直发', '坏果包赔'],
    skuNames: ['5斤装', '10斤装'],
    groupSize: 3,
    groupPrice: 19.9,
    flashPrice: 16.9,
    flashStock: 120,
  },
  {
    id: 'p2',
    categoryId: 'c2',
    shopId: 'shop_1',
    title: '纯棉短袖T恤 男女同款',
    subtitle: '260g重磅纯棉，宽松版型，多色可选',
    price: 39.9,
    market: 89,
    sales: 8600,
    tags: ['100%纯棉', '7天无理由'],
    skuNames: ['白色 M', '白色 L', '黑色 M', '黑色 L'],
    groupSize: 2,
    groupPrice: 29.9,
    bargainStart: 39.9,
    bargainFloor: 19.9,
  },
  {
    id: 'p3',
    categoryId: 'c3',
    shopId: 'shop_3',
    title: '无线蓝牙耳机 降噪长续航',
    subtitle: '蓝牙5.3，入耳式降噪，续航30小时',
    price: 89,
    market: 199,
    sales: 15200,
    tags: ['官方正品', '一年质保'],
    skuNames: ['曜石黑', '云雾白'],
    groupSize: 2,
    groupPrice: 69,
    flashPrice: 59,
    flashStock: 80,
  },
  {
    id: 'p4',
    categoryId: 'c5',
    shopId: 'shop_1',
    title: '不锈钢保温杯 500ml',
    subtitle: '316不锈钢内胆，24小时保温保冷',
    price: 49.9,
    market: 99,
    sales: 4300,
    tags: ['316不锈钢', '包邮'],
    skuNames: ['奶油白', '雾霾蓝', '樱花粉'],
    groupSize: 3,
    groupPrice: 39.9,
  },
  {
    id: 'p5',
    categoryId: 'c8',
    shopId: 'shop_3',
    title: '云南小粒咖啡 冷萃冻干',
    subtitle: '0糖0脂，3秒速溶，12颗装',
    price: 59.9,
    market: 99,
    sales: 6700,
    tags: ['冷萃冻干', '0糖0脂'],
    skuNames: ['经典黑咖 12颗', '生椰拿铁 12颗'],
    flashPrice: 39.9,
    flashStock: 200,
  },
  {
    id: 'p6',
    categoryId: 'c5',
    shopId: 'shop_1',
    title: '厨房多功能收纳架',
    subtitle: '免打孔，双层大容量，承重20kg',
    price: 35.9,
    market: 69,
    sales: 3200,
    tags: ['免打孔', '加厚碳钢'],
    skuNames: ['双层 40cm', '双层 50cm'],
    groupSize: 2,
    groupPrice: 29.9,
  },
  {
    id: 'p7',
    categoryId: 'c2',
    shopId: 'shop_1',
    title: '轻薄防晒衣 UPF50+',
    subtitle: '冰丝凉感，透气速干，男女同款',
    price: 69,
    market: 159,
    sales: 9200,
    tags: ['UPF50+', '冰丝凉感'],
    skuNames: ['白色 M', '白色 L', '浅蓝 L', '浅蓝 XL'],
    groupSize: 2,
    groupPrice: 55,
    bargainStart: 69,
    bargainFloor: 39,
  },
  {
    id: 'p8',
    categoryId: 'c6',
    shopId: 'shop_3',
    title: '儿童益智积木 100粒',
    subtitle: '大颗粒安全材质，启蒙拼搭，收纳桶装',
    price: 45.9,
    market: 99,
    sales: 2800,
    tags: ['安全材质', '启蒙益智'],
    skuNames: ['100粒 桶装', '200粒 桶装'],
    flashPrice: 29.9,
    flashStock: 60,
  },
  {
    id: 'p9',
    categoryId: 'c5',
    shopId: 'shop_1',
    title: '洗衣凝珠 持久留香',
    subtitle: '8倍洁净力，除菌除螨，50颗装',
    price: 39.9,
    market: 79,
    sales: 15600,
    tags: ['除菌除螨', '持久留香'],
    skuNames: ['薰衣草 50颗', '樱花 50颗', '混合 100颗'],
    groupSize: 3,
    groupPrice: 32.9,
  },
  {
    id: 'p10',
    categoryId: 'c3',
    shopId: 'shop_3',
    title: '空气炸锅 家用4L',
    subtitle: '无油低脂，可视窗口，360°热风循环',
    price: 199,
    market: 399,
    sales: 7600,
    tags: ['大容量', '可视窗口'],
    skuNames: ['4L 象牙白', '4L 复古绿'],
    flashPrice: 159,
    flashStock: 40,
  },
  {
    id: 'p11',
    categoryId: 'c8',
    shopId: 'shop_2',
    title: '手工红糖姜茶',
    subtitle: '古法熬制，独立小袋，暖身暖心',
    price: 25.9,
    market: 49,
    sales: 3400,
    tags: ['古法熬制', '独立包装'],
    skuNames: ['12袋装', '24袋装'],
  },
  {
    id: 'p12',
    categoryId: 'c2',
    shopId: 'shop_1',
    title: '简约帆布托特包',
    subtitle: '大容量通勤包，加厚帆布，内置拉链袋',
    price: 29.9,
    market: 69,
    sales: 5200,
    tags: ['大容量', '通勤百搭'],
    skuNames: ['米白', '黑色', '卡其'],
    groupSize: 2,
    groupPrice: 24.9,
  },
  {
    id: 'p13',
    categoryId: 'c6',
    shopId: 'shop_3',
    title: '宠物冻干零食',
    subtitle: '鸡肉冻干，营养高蛋白，猫狗通用',
    price: 49.9,
    market: 89,
    sales: 2100,
    tags: ['高蛋白', '猫狗通用'],
    skuNames: ['鸡肉冻干 100g', '混合冻干 150g'],
    bargainStart: 49.9,
    bargainFloor: 29.9,
  },
  {
    id: 'p14',
    categoryId: 'c7',
    shopId: 'shop_1',
    title: '静音跳绳 健身减脂',
    subtitle: '无绳/有绳双模式，计数显示，防滑手柄',
    price: 19.9,
    market: 39,
    sales: 11800,
    tags: ['静音', '智能计数'],
    skuNames: ['黑色', '粉色'],
    flashPrice: 12.9,
    flashStock: 300,
  },
  {
    id: 'p15',
    categoryId: 'c1',
    shopId: 'shop_2',
    title: '新疆灰枣 特级',
    subtitle: '自然晾晒，皮薄肉厚，甜糯不腻',
    price: 39.9,
    market: 69,
    sales: 8900,
    tags: ['新疆直发', '自然晾晒'],
    skuNames: ['500g', '1kg', '2kg'],
    groupSize: 3,
    groupPrice: 32.9,
  },
  {
    id: 'p16',
    categoryId: 'c3',
    shopId: 'shop_3',
    title: '便携榨汁杯',
    subtitle: '无线便携，一键启动，Type-C充电',
    price: 59.9,
    market: 129,
    sales: 4600,
    tags: ['无线便携', 'Type-C'],
    skuNames: ['牛油果绿', '奶昔白'],
  },
  {
    id: 'p17',
    categoryId: 'c5',
    shopId: 'shop_1',
    title: '纯棉毛巾 3条装',
    subtitle: 'A类纯棉，柔软吸水，独立包装',
    price: 29.9,
    market: 59,
    sales: 7600,
    tags: ['A类纯棉', '柔软吸水'],
    skuNames: ['米白+灰+蓝', '粉+黄+白'],
    groupSize: 3,
    groupPrice: 24.9,
  },
  {
    id: 'p18',
    categoryId: 'c5',
    shopId: 'shop_3',
    title: '桌面氛围台灯',
    subtitle: '三档调光，护眼柔光，触控开关',
    price: 79,
    market: 169,
    sales: 3900,
    tags: ['护眼柔光', '三档调光'],
    skuNames: ['暖光白', '原木色'],
    flashPrice: 59,
    flashStock: 80,
  },
  {
    id: 'p19',
    categoryId: 'c7',
    shopId: 'shop_1',
    title: '男士运动短裤',
    subtitle: '速干透气，弹力腰头，训练跑步',
    price: 39.9,
    market: 89,
    sales: 6800,
    tags: ['速干透气', '弹力腰头'],
    skuNames: ['黑色 L', '黑色 XL', '灰色 L', '灰色 XL'],
    groupSize: 2,
    groupPrice: 32.9,
  },
  {
    id: 'p20',
    categoryId: 'c4',
    shopId: 'shop_3',
    title: '山茶花护手霜',
    subtitle: '滋润不油腻，淡雅花香，30g便携装',
    price: 35.9,
    market: 79,
    sales: 10400,
    tags: ['滋润保湿', '便携装'],
    skuNames: ['山茶花 30g', '山茶花 3支装'],
    flashPrice: 26.9,
    flashStock: 150,
  },
  {
    id: 'p21',
    categoryId: 'c1',
    shopId: 'shop_2',
    title: '烟台红富士苹果 5斤',
    subtitle: '脆甜多汁，果径80mm+，现摘现发',
    price: 49.9,
    market: 79,
    sales: 13200,
    tags: ['现摘现发', '脆甜多汁'],
    skuNames: ['5斤装', '10斤装'],
    groupSize: 3,
    groupPrice: 39.9,
  },
  {
    id: 'p22',
    categoryId: 'c4',
    shopId: 'shop_3',
    title: '补水保湿面膜 20片',
    subtitle: '玻尿酸精华，轻薄服帖，敏感肌可用',
    price: 69,
    market: 139,
    sales: 5700,
    tags: ['敏感肌可用', '补水保湿'],
    skuNames: ['20片装', '40片装'],
    bargainStart: 69,
    bargainFloor: 39,
  },
  {
    id: 'p23',
    categoryId: 'c6',
    shopId: 'shop_1',
    title: '儿童吸管保温杯',
    subtitle: '316不锈钢，防呛吸管，500ml',
    price: 39.9,
    market: 79,
    sales: 3100,
    tags: ['316不锈钢', '防呛设计'],
    skuNames: ['恐龙蓝', '兔子粉'],
    groupSize: 2,
    groupPrice: 29.9,
  },
  {
    id: 'p24',
    categoryId: 'c8',
    shopId: 'shop_2',
    title: '每日坚果礼盒 30袋',
    subtitle: '6种坚果果干，独立小袋，营养早餐',
    price: 89,
    market: 159,
    sales: 4100,
    tags: ['30袋装', '独立小包'],
    skuNames: ['30袋装', '60袋装'],
    flashPrice: 69,
    flashStock: 90,
  },
]

const REVIEW_USERS = ['小橘子', '山风', '阿布', '林小满', '一颗糖', '大麦']
const REVIEW_TEXTS = [
  '收到货了，包装很用心，质量比预期好，会回购。',
  '发货很快，客服态度也好，性价比很高。',
  '实物和描述一致，用了一段时间，整体满意。',
  '朋友推荐来买的，价格实惠，值得入手。',
]

const buildReviews = (productId: string) =>
  REVIEW_USERS.slice(0, 2).map((name, index) => ({
    id: `${productId}_review_${index + 1}`,
    userName: name,
    avatarText: name.slice(0, 1),
    rating: 5,
    content: REVIEW_TEXTS[index % REVIEW_TEXTS.length],
    date: index === 0 ? '2026-11-18' : '2026-11-12',
  }))

const buildProduct = (seed: ProductSeed): Product => {
  const shop = SHOPS.find((item) => item.id === seed.shopId) || SHOPS[0]
  const priceFen = yuanToFen(seed.price)
  const parts = priceParts(priceFen)
  const skuNames = seed.skuNames && seed.skuNames.length ? seed.skuNames : ['默认规格']
  const skus = skuNames.map((name, index) => ({
    id: `${seed.id}_sku_${index + 1}`,
    name,
    priceFen: priceFen + index * 200,
    stock: 80 - index * 8,
  }))

  const groupPriceFen = seed.groupPrice ? yuanToFen(seed.groupPrice) : undefined
  const bargainStartFen = seed.bargainStart ? yuanToFen(seed.bargainStart) : undefined
  const bargainFloorFen = seed.bargainFloor ? yuanToFen(seed.bargainFloor) : undefined
  const flashPriceFen = seed.flashPrice ? yuanToFen(seed.flashPrice) : undefined

  return {
    id: seed.id,
    title: seed.title,
    subtitle: seed.subtitle,
    categoryId: seed.categoryId,
    coverEmoji: PRODUCT_EMOJI[seed.id] || EMOJI_BY_CATEGORY[seed.categoryId] || '🛍️',
    coverTone: seed.categoryId,
    image: productImage(seed.id, seed.categoryId, 1),
    images: [
      productImage(seed.id, seed.categoryId, 1),
      productImage(seed.id, seed.categoryId, 2),
      productImage(seed.id, seed.categoryId, 3),
    ],
    priceFen,
    priceInt: parts.integer,
    priceDec: parts.decimal,
    priceText: fenToYuan(priceFen),
    marketPriceFen: yuanToFen(seed.market),
    marketPriceText: fenToYuan(yuanToFen(seed.market)),
    sales: seed.sales,
    salesText: `已售 ${formatSales(seed.sales)}`,
    tags: seed.tags,
    groupPriceFen,
    groupPriceText: groupPriceFen ? fenToYuan(groupPriceFen) : undefined,
    groupSize: seed.groupSize,
    bargainStartFen,
    bargainStartText: bargainStartFen ? fenToYuan(bargainStartFen) : undefined,
    bargainFloorFen,
    bargainFloorText: bargainFloorFen ? fenToYuan(bargainFloorFen) : undefined,
    flashPriceFen,
    flashPriceText: flashPriceFen ? fenToYuan(flashPriceFen) : undefined,
    flashStock: seed.flashStock,
    defaultSkuId: skus[0] ? skus[0].id : '',
    skus,
    shop,
    reviews: buildReviews(seed.id),
    description: [
      `${seed.title}，${seed.subtitle}。`,
      '源头直采，品质层层把控，下单后48小时内安排发货。',
      '支持7天无理由退换，运输破损包赔，售后无忧。',
    ],
  }
}

export const PRODUCTS: Product[] = PRODUCT_SEEDS.map(buildProduct)

export const BANNERS: Banner[] = [
  {
    id: 'b1',
    image: cover('banner-fresh'),
    emoji: '🍊',
    title: '产地直发',
    subtitle: '新鲜水果 限时直降',
    productId: 'p1',
  },
  {
    id: 'b2',
    image: cover('banner-digital'),
    emoji: '🎧',
    title: '数码好物',
    subtitle: '爆款耳机 拼团更划算',
    productId: 'p3',
  },
  {
    id: 'b3',
    image: cover('banner-home'),
    emoji: '🍳',
    title: '居家焕新',
    subtitle: '精选用品 满99减15',
    productId: 'p10',
  },
]

export const HOT_KEYWORDS = ['脐橙', '蓝牙耳机', '防晒衣', '空气炸锅', '洗衣凝珠', '坚果礼盒']

export interface CouponSeed {
  id: string
  title: string
  subtitle: string
  amount: number
  threshold: number
  validText: string
}

export const COUPON_SEEDS: CouponSeed[] = [
  { id: 'cp1', title: '新人专享券', subtitle: '全场通用', amount: 10, threshold: 59, validText: '有效期至 2026-12-31' },
  { id: 'cp2', title: '全场满减券', subtitle: '全场通用', amount: 15, threshold: 99, validText: '有效期至 2026-12-31' },
  { id: 'cp3', title: '生鲜专享券', subtitle: '生鲜水果可用', amount: 5, threshold: 39, validText: '有效期至 2026-12-15' },
  { id: 'cp4', title: '大额满减券', subtitle: '全场通用', amount: 30, threshold: 199, validText: '有效期至 2026-12-31' },
]
