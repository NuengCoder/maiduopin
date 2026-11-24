import { api } from '../../../services/api'
import { go, showError, toast } from '../../../utils/ui'

interface FlashRow {
  id: string
  productId: string
  title: string
  image: string
  coverEmoji: string
  flashPriceText: string
  priceText: string
  stock: number
  soldPercent: number
  skuId: string
}

Page({
  data: {
    loading: true,
    sessionTitle: '限时秒杀',
    sessionEndAt: 0,
    hasSession: false,
    rows: [] as FlashRow[],
    ended: false,
  },

  onLoad() {
    this.load()
  },

  onShow() {
    if (!this.data.loading) {
      this.load()
    }
  },

  async load() {
    this.setData({ loading: true })
    try {
      const sessions = await api.getFlashSessions()
      const session = sessions[0] || null
      const rows: FlashRow[] = session
        ? session.items.map((item) => {
            const total = Math.max(item.stock, 1)
            const sold = Math.max(0, Math.min(total, item.stock))
            return {
              id: item.product.id,
              productId: item.product.id,
              title: item.product.title,
              image: item.product.image,
              coverEmoji: item.product.coverEmoji,
              flashPriceText: item.flashPriceText,
              priceText: item.product.priceText,
              stock: item.stock,
              soldPercent: Math.round((sold / total) * 100),
              skuId: item.product.defaultSkuId,
            }
          })
        : []
      // Only the fields the view needs - setting the whole session would ship
      // every item's product object to the view layer a second time.
      this.setData({
        sessionTitle: session ? session.title : '限时秒杀',
        sessionEndAt: session ? session.endAt : 0,
        hasSession: Boolean(session),
        rows,
        ended: session ? session.status === 'ENDED' : true,
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  onExpire() {
    this.setData({ ended: true })
  },

  buy(event: WechatMiniprogram.TouchEvent) {
    const productId = event.currentTarget.dataset.product as string
    const skuId = event.currentTarget.dataset.sku as string
    if (!productId || !skuId) {
      toast('商品信息异常')
      return
    }
    if (this.data.ended) {
      toast('本场秒杀已结束')
      return
    }
    go(
      `/packageOrder/pages/checkout/checkout?source=flash&productId=${productId}&skuId=${skuId}&quantity=1`,
    )
  },

  goDetail(event: WechatMiniprogram.TouchEvent) {
    const productId = event.currentTarget.dataset.product as string
    if (productId) {
      go(`/pages/goods/detail?id=${productId}`)
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },
})
