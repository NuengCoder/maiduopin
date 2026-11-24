import { api } from '../../../services/api'
import type { CheckoutInput, CheckoutPreview, CheckoutSource } from '../../../types/models'
import { askConfirm, go, redirect, showError, toast } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    submitting: false,
    input: {} as CheckoutInput,
    preview: null as CheckoutPreview | null,
  },

  onLoad(options: Record<string, string>) {
    const source = (options.source || 'cart') as CheckoutSource
    const input: CheckoutInput = {
      source,
      productId: options.productId,
      skuId: options.skuId,
      quantity: options.quantity ? Number(options.quantity) : 1,
      groupId: options.groupId,
      bargainId: options.bargainId,
    }
    this.setData({ input })
    this.load()
  },

  onShow() {
    if (this.data.preview && !this.data.loading) {
      this.load()
    }
  },

  async load() {
    this.setData({ loading: true })
    try {
      const preview = await api.getCheckoutPreview(this.data.input)
      this.setData({ preview })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  chooseAddress() {
    go('/packageOrder/pages/address-list/address-list?select=1')
  },

  async submit() {
    const preview = this.data.preview
    if (!preview || this.data.submitting) {
      return
    }
    if (!preview.address) {
      toast('请先选择收货地址')
      this.chooseAddress()
      return
    }

    this.setData({ submitting: true })
    try {
      const order = await api.createOrder(this.data.input)
      const accepted = await askConfirm(
        '模拟支付',
        `应付 ¥${order.payText}，是否完成支付？`,
        '支付成功',
      )
      if (accepted) {
        await api.mockPay(order.id)
        toast('支付成功', 'success')
      } else {
        toast('订单已创建，可在订单列表继续支付')
      }
      redirect(`/packageOrder/pages/order-detail/order-detail?id=${order.id}`)
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ submitting: false })
    }
  },

  openCoupons() {
    go('/packageGrowth/pages/coupon-center/coupon-center')
  },
})
