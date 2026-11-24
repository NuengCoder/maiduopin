import { api } from '../../services/api'
import type { ProductCard } from '../../types/models'
import { back, showError, toast } from '../../utils/ui'

type SortKey = 'default' | 'sales' | 'price_asc' | 'price_desc'

Page({
  data: {
    keyword: '',
    hot: [] as string[],
    results: [] as ProductCard[],
    loading: false,
    searched: false,
    sort: 'default' as SortKey,
    sorts: [
      { key: 'default', label: '综合' },
      { key: 'sales', label: '销量' },
      { key: 'price_asc', label: '价格↑' },
      { key: 'price_desc', label: '价格↓' },
    ],
  },

  onLoad(options: Record<string, string>) {
    this.loadHot()
    if (options.keyword) {
      this.setData({ keyword: options.keyword })
      this.onSearch()
    }
  },

  async loadHot() {
    try {
      const hot = await api.getSearchHot()
      this.setData({ hot })
    } catch (error) {
      showError(error)
    }
  },

  onInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ keyword: event.detail.value })
  },

  onHotTap(event: WechatMiniprogram.TouchEvent) {
    const keyword = event.currentTarget.dataset.keyword as string
    if (!keyword) {
      return
    }
    this.setData({ keyword })
    this.onSearch()
  },

  async onSearch() {
    const keyword = this.data.keyword.trim()
    if (!keyword) {
      toast('请输入搜索关键词')
      return
    }
    this.setData({ loading: true, searched: true })
    try {
      const results = await api.getProducts({ keyword, sort: this.data.sort })
      this.setData({ results })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  onSort(event: WechatMiniprogram.TouchEvent) {
    const sort = event.currentTarget.dataset.sort as SortKey
    if (!sort || sort === this.data.sort) {
      return
    }
    this.setData({ sort })
    if (this.data.searched) {
      this.onSearch()
    }
  },

  goBack() {
    back()
  },
})
