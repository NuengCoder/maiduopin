import { api } from '../../services/api'
import type { Product } from '../../types/models'
import { go, showError, switchTab, toast } from '../../utils/ui'

Page({
  data: {
    loading: true,
    product: null as Product | null,
    selectedSkuId: '',
    selectedSkuName: '',
    selectedStock: 0,
    priceFen: 0,
    quantity: 1,
    skuVisible: false,
    favorite: false,
  },

  onLoad(options: Record<string, string>) {
    if (!options.id) {
      toast('商品不存在')
      return
    }
    this.load(options.id)
  },

  async load(productId: string) {
    this.setData({ loading: true })
    try {
      const product = await api.getProduct(productId)
      const firstSku = product.skus[0]
      this.setData({
        product,
        selectedSkuId: firstSku ? firstSku.id : '',
        selectedSkuName: firstSku ? firstSku.name : '',
        selectedStock: firstSku ? firstSku.stock : 0,
        priceFen: firstSku ? firstSku.priceFen : product.priceFen,
        quantity: 1,
        favorite: api.isFavorite(productId),
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  openSku() {
    this.setData({ skuVisible: true })
  },

  closeSku() {
    this.setData({ skuVisible: false })
  },

  selectSku(event: WechatMiniprogram.TouchEvent) {
    const skuId = event.currentTarget.dataset.id as string
    const product = this.data.product
    if (!product || !skuId) {
      return
    }
    const sku = product.skus.find((item) => item.id === skuId)
    if (!sku) {
      return
    }
    this.setData({
      selectedSkuId: sku.id,
      selectedSkuName: sku.name,
      selectedStock: sku.stock,
      priceFen: sku.priceFen,
      quantity: Math.min(this.data.quantity, sku.stock),
    })
  },

  changeQuantity(event: WechatMiniprogram.TouchEvent) {
    const delta = Number(event.currentTarget.dataset.delta)
    const next = this.data.quantity + delta
    if (next < 1) {
      toast('数量不能再少了')
      return
    }
    if (next > this.data.selectedStock) {
      toast('库存不足')
      return
    }
    this.setData({ quantity: next })
  },

  async addToCart() {
    const product = this.data.product
    if (!product) {
      return
    }
    if (!this.data.selectedSkuId) {
      this.openSku()
      return
    }
    try {
      await api.addToCart(product.id, this.data.selectedSkuId, this.data.quantity)
      this.setData({ skuVisible: false })
      toast('已加入购物车', 'success')
    } catch (error) {
      showError(error)
    }
  },

  buyNow() {
    const product = this.data.product
    if (!product) {
      return
    }
    if (!this.data.selectedSkuId) {
      this.openSku()
      return
    }
    go(
      `/packageOrder/pages/checkout/checkout?source=buy&productId=${product.id}&skuId=${
        this.data.selectedSkuId
      }&quantity=${this.data.quantity}`,
    )
  },

  async startGroup() {
    const product = this.data.product
    if (!product) {
      return
    }
    try {
      const group = await api.createGroup(product.id, this.data.selectedSkuId)
      this.setData({ skuVisible: false })
      go(`/packageGrowth/pages/group-detail/group-detail?id=${group.id}`)
    } catch (error) {
      showError(error)
    }
  },

  async startBargain() {
    const product = this.data.product
    if (!product) {
      return
    }
    try {
      const bargain = await api.createBargain(product.id, this.data.selectedSkuId)
      this.setData({ skuVisible: false })
      go(`/packageGrowth/pages/bargain-detail/bargain-detail?id=${bargain.id}`)
    } catch (error) {
      showError(error)
    }
  },

  goFlash() {
    go('/packageGrowth/pages/flash-sale/flash-sale')
  },

  goCoupons() {
    go('/packageGrowth/pages/coupon-center/coupon-center')
  },

  goCart() {
    switchTab('/pages/cart/cart')
  },

  async toggleFavorite() {
    const product = this.data.product
    if (!product) {
      return
    }
    try {
      const favorite = await api.toggleFavorite(product.id)
      this.setData({ favorite })
      toast(favorite ? '已收藏' : '已取消收藏')
    } catch (error) {
      showError(error)
    }
  },

  goShop() {
    toast('店铺主页准备中')
  },

  previewImage(event: WechatMiniprogram.TouchEvent) {
    const current = event.currentTarget.dataset.src as string
    const product = this.data.product
    if (!product || !current) {
      return
    }
    // Generated covers are data URIs; previewImage only accepts real files or
    // http(s) URLs, so skip the gesture unless a CDN is configured.
    const urls = product.images.filter((url) => /^https?:\/\//.test(url))
    if (!urls.length) {
      return
    }
    wx.previewImage({ current, urls })
  },

  onShareAppMessage() {
    const product = this.data.product
    return {
      title: product ? product.title : '卖多品',
      path: product ? `/pages/goods/detail?id=${product.id}` : '/pages/home/home',
    }
  },
})
