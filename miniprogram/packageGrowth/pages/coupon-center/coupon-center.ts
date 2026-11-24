import { api } from '../../../services/api'
import type { Coupon } from '../../../types/models'
import { showError, toast } from '../../../utils/ui'

type CouponTab = 'center' | 'mine'

const STATUS_TEXT: Record<string, string> = {
  AVAILABLE: '去使用',
  CLAIMED: '已领取',
  LOCKED: '已锁定',
  USED: '已使用',
  EXPIRED: '已过期',
}

Page({
  data: {
    tab: 'center' as CouponTab,
    loading: true,
    coupons: [] as Coupon[],
    usableCount: 0,
  },

  onLoad() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      if (this.data.tab === 'center') {
        const coupons = await api.getCoupons()
        this.setData({ coupons })
      } else {
        const coupons = await api.getMyCoupons()
        this.setData({
          coupons,
          usableCount: coupons.filter((coupon) => coupon.status === 'AVAILABLE').length,
        })
      }
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  onTab(event: WechatMiniprogram.TouchEvent) {
    const tab = event.currentTarget.dataset.tab as CouponTab
    if (!tab || tab === this.data.tab) {
      return
    }
    this.setData({ tab })
    this.load()
  },

  async claim(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }
    try {
      await api.claimCoupon(id)
      toast('领取成功', 'success')
      this.load()
    } catch (error) {
      showError(error)
    }
  },

  statusText(coupon: Coupon): string {
    return STATUS_TEXT[coupon.status] || '查看'
  },

  goCenter() {
    if (this.data.tab === 'mine') {
      this.setData({ tab: 'center' })
      this.load()
    }
  },
})
