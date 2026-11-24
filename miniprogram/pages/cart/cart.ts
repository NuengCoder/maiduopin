import { api } from '../../services/api'
import type { CartItem } from '../../types/models'
import { fenToYuan } from '../../utils/money'
import { askConfirm, go, showError, switchTab, toast } from '../../utils/ui'

Page({
  data: {
    loading: true,
    items: [] as CartItem[],
    selectedCount: 0,
    selectedAmountText: '0.00',
    allSelected: false,
  },

  onShow() {
    const tabBar = (this as unknown as { getTabBar?: () => { refresh: (index: number) => void } })
      .getTabBar?.()
    if (tabBar) {
      tabBar.refresh(2)
    }
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const items = await api.getCart()
      this.apply(items)
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  apply(items: CartItem[]) {
    const selected = items.filter((item) => item.selected)
    const selectedAmount = selected.reduce(
      (sum, item) => sum + item.unitPriceFen * item.quantity,
      0,
    )
    this.setData({
      items,
      selectedCount: selected.reduce((sum, item) => sum + item.quantity, 0),
      selectedAmountText: fenToYuan(selectedAmount),
      allSelected: items.length > 0 && items.every((item) => item.selected),
    })
    const tabBar = (this as unknown as { getTabBar?: () => { refresh: (index: number) => void } })
      .getTabBar?.()
    if (tabBar) {
      tabBar.refresh(2)
    }
  },

  onToggle(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const item = this.data.items.find((entry) => entry.id === id)
    if (!item) {
      return
    }
    api.updateCartItem(id, { selected: !item.selected }).then((items) => this.apply(items))
  },

  onQuantity(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const delta = Number(event.currentTarget.dataset.delta)
    const item = this.data.items.find((entry) => entry.id === id)
    if (!item) {
      return
    }
    if (delta < 0 && item.quantity <= 1) {
      toast('数量不能再少了')
      return
    }
    api
      .updateCartItem(id, { quantity: item.quantity + delta })
      .then((items) => this.apply(items))
      .catch(showError)
  },

  async onRemove(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const item = this.data.items.find((entry) => entry.id === id)
    if (!item) {
      return
    }
    const accepted = await askConfirm('移除商品', `确定将「${item.title}」移出购物车吗？`, '移除')
    if (!accepted) {
      return
    }
    try {
      const items = await api.removeCartItem(id)
      this.apply(items)
    } catch (error) {
      showError(error)
    }
  },

  onSelectAll() {
    api
      .toggleAllCart(!this.data.allSelected)
      .then((items) => this.apply(items))
      .catch(showError)
  },

  onCheckout() {
    if (!this.data.selectedCount) {
      toast('请先选择商品')
      return
    }
    go('/packageOrder/pages/checkout/checkout?source=cart')
  },

  goHome() {
    switchTab('/pages/home/home')
  },

  goDetail(event: WechatMiniprogram.TouchEvent) {
    const productId = event.currentTarget.dataset.id as string
    if (productId) {
      go(`/pages/goods/detail?id=${productId}`)
    }
  },
})
