import { api } from '../../../services/api'
import type { Order, OrderStatus } from '../../../types/models'
import { askConfirm, go, showError, switchTab, toast } from '../../../utils/ui'

type OrderTab = OrderStatus | 'ALL'

const TABS: Array<{ key: OrderTab; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'COMPLETED', label: '已完成' },
]

Page({
  data: {
    tabs: TABS,
    active: 'ALL' as OrderTab,
    orders: [] as Order[],
    loading: true,
  },

  onLoad(options: Record<string, string>) {
    const status = (options.status || 'ALL') as OrderTab
    if (TABS.some((tab) => tab.key === status)) {
      this.setData({ active: status })
    }
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const orders = await api.getOrders(this.data.active)
      this.setData({ orders })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  onTab(event: WechatMiniprogram.TouchEvent) {
    const key = event.currentTarget.dataset.key as OrderTab
    if (!key || key === this.data.active) {
      return
    }
    this.setData({ active: key })
    this.load()
  },

  goDetail(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (id) {
      go(`/packageOrder/pages/order-detail/order-detail?id=${id}`)
    }
  },

  async payOrder(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const order = this.data.orders.find((item) => item.id === id)
    if (!order) {
      return
    }
    const accepted = await askConfirm('模拟支付', `应付 ¥${order.payText}，是否完成支付？`, '支付成功')
    if (!accepted) {
      return
    }
    try {
      await api.mockPay(id)
      toast('支付成功', 'success')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  async cancelOrder(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const accepted = await askConfirm('取消订单', '确定取消该订单吗？', '取消订单')
    if (!accepted) {
      return
    }
    try {
      await api.cancelOrder(id)
      toast('订单已取消')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  async confirmOrder(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const accepted = await askConfirm('确认收货', '确认已收到商品吗？', '确认收货')
    if (!accepted) {
      return
    }
    try {
      await api.confirmOrder(id)
      toast('已确认收货', 'success')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  goHome() {
    switchTab('/pages/home/home')
  },
})
