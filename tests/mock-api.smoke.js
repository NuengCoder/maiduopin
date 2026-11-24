const store = new Map()

global.wx = {
  getStorageSync(key) {
    return store.has(key) ? store.get(key) : ''
  },
  setStorageSync(key, value) {
    store.set(key, JSON.parse(JSON.stringify(value)))
  },
  removeStorageSync(key) {
    store.delete(key)
  },
}

const { api } = require('../node_modules/.cache/maiduopin-smoke/services/api.js')

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

const run = async () => {
  api.ensureSeed()

  const home = await api.getHome()
  assert(home.feed.length >= 20, 'home feed has products')
  assert(home.categories.length === 8, 'home has 8 categories')

  // Artwork contract: covers must be inline (offline, instant) and each card
  // must carry the emoji that ties the art to the product.
  const dataUri = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/
  for (const card of home.feed) {
    assert(dataUri.test(card.image), `cover for ${card.id} is an inline data URI`)
    assert(Boolean(card.coverEmoji), `card ${card.id} has a cover emoji`)
    assert(card.images === undefined, `list payload for ${card.id} omits gallery images`)
    assert(card.skus === undefined, `list payload for ${card.id} omits skus`)
    assert(card.reviews === undefined, `list payload for ${card.id} omits reviews`)
    assert(card.defaultSkuId, `card ${card.id} exposes a default sku id`)
  }

  // The feed is what pages push through setData, so keep it small.
  const feedKb = JSON.stringify(home.feed).length / 1024
  assert(feedKb < 30, `home feed payload stays under 30 KB (was ${feedKb.toFixed(1)} KB)`)

  const product = await api.getProduct('p2')
  assert(product.images.length === 3, 'detail exposes three gallery images')
  assert(product.images.every((url) => dataUri.test(url)), 'gallery images are inline')
  assert(product.skus.length > 0, 'detail exposes skus')
  assert(product.defaultSkuId === product.skus[0].id, 'default sku id points at the first sku')

  const sku = product.skus[0]
  assert(sku, 'product has a sku')

  const cart = await api.addToCart(product.id, sku.id, 2)
  assert(cart.length === 1 && cart[0].quantity === 2, 'cart add merges quantity')

  const preview = await api.getCheckoutPreview({ source: 'cart' })
  assert(preview.payFen > 0, 'cart checkout has payable amount')
  assert(preview.address, 'default address is available')

  const couponCenter = await api.getCoupons()
  await api.claimCoupon(couponCenter[0].id)
  const myCoupons = await api.getMyCoupons()
  assert(
    myCoupons.some((coupon) => coupon.status === 'AVAILABLE'),
    'claimed coupon is available',
  )

  const order = await api.createOrder({ source: 'cart' })
  assert(order.status === 'PENDING_PAYMENT', 'new order is pending payment')
  const paid = await api.mockPay(order.id)
  assert(paid.status === 'PAID', 'mock payment marks order paid')

  const group = await api.createGroup(product.id, sku.id)
  assert(group.members.length === 1, 'group starts with the current user')
  const joined = await api.simulateGroupJoin(group.id)
  assert(joined.members.length === 2, 'simulated friend joins the group')

  const groupOrder = await api.createOrder({ source: 'group', groupId: group.id })
  await api.mockPay(groupOrder.id)
  const paidGroup = await api.getGroup(group.id)
  assert(paidGroup.status === 'SUCCESS', 'group succeeds once required members pay')
  assert(paidGroup.orderId === groupOrder.id, 'group links to its order')

  const bargain = await api.createBargain(product.id, sku.id)
  let updatedBargain = bargain
  let cutAttempts = 0
  while (updatedBargain.status === 'ACTIVE') {
    if (cutAttempts >= 10) {
      throw new Error('bargain did not reach floor price')
    }
    cutAttempts += 1
    updatedBargain = await api.cutBargain(bargain.id)
  }
  assert(updatedBargain.status === 'READY', 'bargain reaches its floor price')
  assert(updatedBargain.cuts.length > 0, 'bargain records helper cuts')

  const bargainPreview = await api.getCheckoutPreview({
    source: 'bargain',
    bargainId: bargain.id,
  })
  assert(
    bargainPreview.items[0].unitPriceFen === updatedBargain.currentPriceFen,
    'bargain price is applied at checkout',
  )

  const sessions = await api.getFlashSessions()
  assert(sessions[0] && sessions[0].items.length > 0, 'flash session has items')

  await api.toggleFavorite(product.id)
  const favorites = await api.getFavorites()
  assert(favorites.length === 1, 'favorite is persisted')

  const referral = await api.getReferralData()
  assert(referral.inviteCode, 'referral code exists')

  const orders = await api.getOrders('ALL')
  assert(orders.length >= 3, 'orders are persisted')

  console.log(
    `Mock API smoke test passed: ${orders.length} orders, group=${paidGroup.status}, bargain=${updatedBargain.status}, flash items=${sessions[0].items.length}.`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
