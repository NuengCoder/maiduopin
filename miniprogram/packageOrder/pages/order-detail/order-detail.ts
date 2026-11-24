import { api } from '../../../services/api'
import type { Order } from '../../../types/models'
import { askConfirm, go, showError, switchTab, toast } from '../../../utils/ui'

Page({
  data: {
    id: '',
    loading: true,
    order: null as Order | null,
  },

  onLoad(options: Record<string, string>) {
    if (options.id) {
      this.setData({ id: options.id })
    }
  },

  onShow() {
    if (this.data.id) {
      this.load()
    }
  },

  async load() {
    this.setData({ loading: true })
    try {
      const order = await api.getOrder(this.data.id)
      this.setData({ order })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async pay() {
    const order = this.data.order
    if (!order) {
      return
    }
    const accepted = await askConfirm('模拟支付', `应付 ¥${order.payText}，是否完成支付？`, '支付成功')
    if (!accepted) {
      return
    }
    try {
      await api.mockPay(order.id)
      toast('支付成功', 'success')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  async cancel() {
    const order = this.data.order
    if (!order) {
      return
    }
    const accepted = await askConfirm('取消订单', '确定取消该订单吗？', '取消订单')
    if (!accepted) {
      return
    }
    try {
      await api.cancelOrder(order.id)
      toast('订单已取消')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  async confirmReceipt() {
    const order = this.data.order
    if (!order) {
      return
    }
    const accepted = await askConfirm('确认收货', '确认已收到商品吗？', '确认收货')
    if (!accepted) {
      return
    }
    try {
      await api.confirmOrder(order.id)
      toast('已确认收货', 'success')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  goGroup() {
    const order = this.data.order
    if (order && order.groupId) {
      go(`/packageGrowth/pages/group-detail/group-detail?id=${order.groupId}`)
    }
  },

  goBargain() {
    const order = this.data.order
    if (order && order.bargainId) {
      go(`/packageGrowth/pages/bargain-detail/bargain-detail?id=${order.bargainId}`)
    }
  },

  copyOrderNo() {
    const order = this.data.order
    if (!order) {
      return
    }
    wx.setClipboardData({
      data: order.orderNo,
      success: () => toast('订单号已复制'),
    })
  },

  remindShip() {
    toast('已提醒商家发货')
  },

  applyAfterSale() {
    toast('售后申请已记录，客服会尽快联系您')
  },

  goHome() {
    switchTab('/pages/home/home')
  },
})
