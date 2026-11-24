import { api, CURRENT_USER_ID } from '../../../services/api'
import type { GroupInstance, Product, Sku } from '../../../types/models'
import { go, showError, toast } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    group: null as GroupInstance | null,
    product: null as Product | null,
    skuName: '',
    memberSlots: [] as Array<{ id: string; avatarText: string; name: string; paid: boolean; empty?: boolean }>,
    paidCount: 0,
    myPaid: false,
    myJoined: false,
    statusText: '',
    statusHint: '',
    acting: false,
  },

  onLoad(options: Record<string, string>) {
    if (!options.id) {
      toast('拼团不存在')
      return
    }
    this.setData({ group: { id: options.id } as GroupInstance })
    this.load(options.id)
  },

  onShow() {
    const group = this.data.group
    if (group && group.id && !this.data.loading) {
      this.load(group.id)
    }
  },

  async load(groupId: string) {
    this.setData({ loading: true })
    try {
      const group = await api.getGroup(groupId)
      const product = await api.getProduct(group.productId)
      const sku = product.skus.find((item: Sku) => item.id === group.skuId) || product.skus[0]
      const paidCount = group.members.filter((member) => member.paid).length
      const myMember = group.members.find((member) => member.id === CURRENT_USER_ID)
      const memberSlots = group.members.map((member) => ({
        id: member.id,
        avatarText: member.avatarText,
        name: member.name,
        paid: member.paid,
      })) as typeof this.data.memberSlots
      for (let i = group.members.length; i < group.requiredCount; i += 1) {
        memberSlots.push({ id: `empty_${i}`, avatarText: '', name: '', paid: false, empty: true })
      }

      this.setData({
        group,
        product,
        skuName: sku ? sku.name : '',
        memberSlots,
        paidCount,
        myPaid: Boolean(myMember && myMember.paid),
        myJoined: Boolean(myMember),
        statusText:
          group.status === 'SUCCESS'
            ? '拼团成功'
            : group.status === 'FAILED'
              ? '拼团失败'
              : '拼团进行中',
        statusHint:
          group.status === 'SUCCESS'
            ? '已拼成，商家将尽快发货'
            : group.status === 'FAILED'
              ? '未能按时成团，可重新发起'
              : `还差 ${Math.max(0, group.requiredCount - paidCount)} 人成团，邀请好友一起拼`,
      })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  async simulateJoin() {
    const group = this.data.group
    if (!group || this.data.acting) {
      return
    }
    this.setData({ acting: true })
    try {
      await api.simulateGroupJoin(group.id)
      toast('好友已参团', 'success')
      await this.load(group.id)
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ acting: false })
    }
  },

  pay() {
    const group = this.data.group
    if (!group) {
      return
    }
    if (group.status === 'FAILED') {
      toast('该拼团已结束，请重新发起')
      return
    }
    go(`/packageOrder/pages/checkout/checkout?source=group&groupId=${group.id}`)
  },

  goOrder() {
    const group = this.data.group
    if (group && group.orderId) {
      go(`/packageOrder/pages/order-detail/order-detail?id=${group.orderId}`)
    }
  },

  goProduct() {
    const product = this.data.product
    if (product) {
      go(`/pages/goods/detail?id=${product.id}`)
    }
  },

  onShareAppMessage() {
    const product = this.data.product
    const group = this.data.group
    return {
      title: product ? `我正在拼「${product.title}」，就差你了` : '卖多品拼团，一起买更便宜',
      path: group
        ? `/packageGrowth/pages/group-detail/group-detail?id=${group.id}`
        : '/pages/home/home',
    }
  },
})
