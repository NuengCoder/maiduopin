import { api } from '../../../services/api'
import type { ProductCard } from '../../../types/models'
import { askConfirm, switchTab, toast, showError } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    products: [] as ProductCard[],
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const products = await api.getFavorites()
      this.setData({ products })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async onLongPress(event: WechatMiniprogram.TouchEvent) {
    const productId = event.currentTarget.dataset.id as string
    const product = this.data.products.find((item) => item.id === productId)
    if (!product) {
      return
    }
    const accepted = await askConfirm('取消收藏', `确定不再收藏「${product.title}」吗？`, '取消收藏')
    if (!accepted) {
      return
    }
    try {
      await api.toggleFavorite(productId)
      toast('已取消收藏')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  goHome() {
    switchTab('/pages/home/home')
  },
})
