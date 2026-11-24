import { api } from '../../services/api'
import type { Banner, Category, ProductCard } from '../../types/models'
import { go, showError, switchTab } from '../../utils/ui'

Page({
  data: {
    loading: true,
    banners: [] as Banner[],
    categories: [] as Category[],
    flashProducts: [] as ProductCard[],
    groupProducts: [] as ProductCard[],
    feed: [] as ProductCard[],
    flashEndAt: 0,
  },

  onLoad() {
    this.load()
  },

  onShow() {
    const tabBar = (this as unknown as { getTabBar?: () => { refresh: (index: number) => void } })
      .getTabBar?.()
    if (tabBar) {
      tabBar.refresh(0)
    }
  },

  onPullDownRefresh() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const [home, sessions] = await Promise.all([api.getHome(), api.getFlashSessions()])
      this.setData({
        banners: home.banners,
        categories: home.categories,
        flashProducts: home.flashProducts,
        groupProducts: home.groupProducts,
        feed: home.feed,
        flashEndAt: sessions[0] ? sessions[0].endAt : Date.now() + 2 * 60 * 60 * 1000,
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  goSearch() {
    go('/pages/search/search')
  },

  goFlash() {
    go('/packageGrowth/pages/flash-sale/flash-sale')
  },

  goCoupons() {
    go('/packageGrowth/pages/coupon-center/coupon-center')
  },

  goDetail(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (id) {
      go(`/pages/goods/detail?id=${id}`)
    }
  },

  onCategoryTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }
    api.saveSelectedCategory(id)
    switchTab('/pages/category/category')
  },

  onShareAppMessage() {
    return {
      title: '卖多品 — 拼团好物，省得更多',
      path: '/pages/home/home',
    }
  },
})
