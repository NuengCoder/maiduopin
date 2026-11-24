import { api } from '../../../services/api'
import type { BargainInstance, Product, Sku } from '../../../types/models'
import { go, showError, toast } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    bargain: null as BargainInstance | null,
    product: null as Product | null,
    skuName: '',
    progress: 0,
    savedText: '0.00',
    remainText: '0.00',
    statusText: '',
    statusHint: '',
    acting: false,
  },

  onLoad(options: Record<string, string>) {
    if (!options.id) {
      toast('砍价活动不存在')
      return
    }
    this.setData({ bargain: { id: options.id } as BargainInstance })
    this.load(options.id)
  },

  onShow() {
    const bargain = this.data.bargain
    if (bargain && bargain.id && !this.data.loading) {
      this.load(bargain.id)
    }
  },

  async load(bargainId: string) {
    this.setData({ loading: true })
    try {
      const bargain = await api.getBargain(bargainId)
      const product = await api.getProduct(bargain.productId)
      const sku = product.skus.find((item: Sku) => item.id === bargain.skuId) || product.skus[0]
      const total = bargain.startPriceFen - bargain.floorPriceFen
      const saved = bargain.startPriceFen - bargain.currentPriceFen
      const progress = total > 0 ? Math.min(100, Math.round((saved / total) * 100)) : 100

      this.setData({
        bargain,
        product,
        skuName: sku ? sku.name : '',
        progress,
        savedText: (saved / 100).toFixed(2),
        remainText: ((bargain.currentPriceFen - bargain.floorPriceFen) / 100).toFixed(2),
        statusText:
          bargain.status === 'ORDERED'
            ? '砍价成功，已下单'
            : bargain.status === 'EXPIRED'
              ? '砍价已过期'
              : bargain.status === 'READY'
                ? '已砍到底价'
                : '砍价进行中',
        statusHint:
          bargain.status === 'READY'
            ? '已达到最低价，立即下单带走'
            : bargain.status === 'EXPIRED'
              ? '本次活动已结束，可重新发起砍价'
              : '邀请好友帮砍，越砍越便宜',
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async cut() {
    const bargain = this.data.bargain
    if (!bargain || this.data.acting) {
      return
    }
    this.setData({ acting: true })
    try {
      const updated = await api.cutBargain(bargain.id)
      const lastCut = updated.cuts[0]
      toast(lastCut ? `好友帮砍 ¥${lastCut.amountText}` : '助力成功')
      await this.load(bargain.id)
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ acting: false })
    }
  },

  buy() {
    const bargain = this.data.bargain
    if (!bargain) {
      return
    }
    if (bargain.status === 'EXPIRED' || bargain.status === 'ORDERED') {
      toast('该砍价已结束')
      return
    }
    go(`/packageOrder/pages/checkout/checkout?source=bargain&bargainId=${bargain.id}`)
  },

  goOrder() {
    const bargain = this.data.bargain
    if (bargain && bargain.orderId) {
      go(`/packageOrder/pages/order-detail/order-detail?id=${bargain.orderId}`)
    }
  },

  goProduct() {
    const product = this.data.product
    if (product) {
      go(`/pages/goods/detail?id=${product.id}`)
    }
  },

  onShareAppMessage() {
    const bargain = this.data.bargain
    const product = this.data.product
    return {
      title: product ? `帮我砍一刀「${product.title}」，现在只要 ¥${bargain?.currentPriceText}` : '卖多品砍价',
      path: bargain
        ? `/packageGrowth/pages/bargain-detail/bargain-detail?id=${bargain.id}`
        : '/pages/home/home',
    }
  },
})
