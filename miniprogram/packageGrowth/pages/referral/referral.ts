import { api } from '../../../services/api'
import type { ReferralData, User } from '../../../types/models'
import { showError, toast } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    user: null as User | null,
    referral: null as ReferralData | null,
  },

  onLoad() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const [user, referral] = await Promise.all([api.getMe(), api.getReferralData()])
      this.setData({ user, referral })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  copyCode() {
    const referral = this.data.referral
    if (!referral) {
      return
    }
    wx.setClipboardData({
      data: referral.inviteCode,
      success: () => toast('邀请码已复制'),
    })
  },

  onShareAppMessage() {
    const referral = this.data.referral
    return {
      title: '卖多品新人礼：领 10 元无门槛券，一起省更多',
      path: referral
        ? `/pages/home/home?inviteCode=${referral.inviteCode}`
        : '/pages/home/home',
    }
  },
})
