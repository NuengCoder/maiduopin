import { api } from '../../services/api'
import type { Order, User } from '../../types/models'
import { go, showError, toast } from '../../utils/ui'

interface MenuEntry {
  key: string
  icon: string
  label: string
  desc: string
  url: string
}

const MENUS: MenuEntry[] = [
  {
    key: 'coupons',
    icon: '🎟️',
    label: '我的优惠券',
    desc: '查看可用优惠',
    url: '/packageGrowth/pages/coupon-center/coupon-center',
  },
  {
    key: 'favorites',
    icon: '❤️',
    label: '我的收藏',
    desc: '喜欢的好物',
    url: '/packageUser/pages/favorites/favorites',
  },
  {
    key: 'addresses',
    icon: '📍',
    label: '收货地址',
    desc: '管理常用地址',
    url: '/packageOrder/pages/address-list/address-list?select=0',
  },
  {
    key: 'referral',
    icon: '🎁',
    label: '邀请有礼',
    desc: '邀好友得优惠券',
    url: '/packageGrowth/pages/referral/referral',
  },
  {
    key: 'orders',
    icon: '📦',
    label: '全部订单',
    desc: '查看订单与售后',
    url: '/packageOrder/pages/order-list/order-list?status=ALL',
  },
]

Page({
  data: {
    loading: true,
    user: null as User | null,
    menus: MENUS,
    counts: {
      pending: 0,
      toShip: 0,
      shipped: 0,
      completed: 0,
    },
  },

  onShow() {
    const tabBar = (this as unknown as { getTabBar?: () => { refresh: (index: number) => void } })
      .getTabBar?.()
    if (tabBar) {
      tabBar.refresh(3)
    }
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const [user, orders] = await Promise.all([api.getMe(), api.getOrders('ALL')])
      this.setData({
        user,
        counts: this.countOrders(orders),
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  countOrders(orders: Order[]) {
    return {
      pending: orders.filter((order) => order.status === 'PENDING_PAYMENT').length,
      toShip: orders.filter((order) => order.status === 'PAID' || order.status === 'TO_SHIP')
        .length,
      shipped: orders.filter((order) => order.status === 'SHIPPED').length,
      completed: orders.filter((order) => order.status === 'COMPLETED').length,
    }
  },

  goOrders(event: WechatMiniprogram.TouchEvent) {
    const status = (event.currentTarget.dataset.status as string) || 'ALL'
    go(`/packageOrder/pages/order-list/order-list?status=${status}`)
  },

  goMenu(event: WechatMiniprogram.TouchEvent) {
    const url = event.currentTarget.dataset.url as string
    if (url) {
      go(url)
      return
    }
    toast('功能准备中')
  },

  openSettings() {
    toast('设置功能准备中')
  },
})
