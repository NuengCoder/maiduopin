import { api } from '../../services/api'
import type { Category, ProductCard } from '../../types/models'
import { go, showError } from '../../utils/ui'

Page({
  data: {
    loading: true,
    categories: [] as Category[],
    activeId: '',
    products: [] as ProductCard[],
  },

  onLoad() {
    this.load()
  },

  onShow() {
    const tabBar = (this as unknown as { getTabBar?: () => { refresh: (index: number) => void } })
      .getTabBar?.()
    if (tabBar) {
      tabBar.refresh(1)
    }

    const selected = api.takeSelectedCategory()
    if (selected && selected !== this.data.activeId) {
      this.setData({ activeId: selected })
      this.loadProducts(selected)
    }
  },

  async load() {
    this.setData({ loading: true })
    try {
      const categories = await api.getCategories()
      const activeId = this.data.activeId || (categories[0] ? categories[0].id : '')
      this.setData({ categories, activeId })
      if (activeId) {
        await this.loadProducts(activeId)
      }
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadProducts(categoryId: string) {
    try {
      const products = await api.getProducts({ categoryId })
      this.setData({ products })
    } catch (error) {
      showError(error)
    }
  },

  onCategoryTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id || id === this.data.activeId) {
      return
    }
    this.setData({ activeId: id, loading: true })
    this.loadProducts(id).finally(() => this.setData({ loading: false }))
  },

  goSearch() {
    go('/pages/search/search')
  },
})
