import { api } from '../../../services/api'
import type { Address } from '../../../types/models'
import { askConfirm, back, go, showError } from '../../../utils/ui'

Page({
  data: {
    loading: true,
    selectMode: false,
    addresses: [] as Address[],
  },

  onLoad(options: Record<string, string>) {
    this.setData({ selectMode: options.select === '1' })
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const addresses = await api.getAddresses()
      this.setData({ addresses })
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  onCardTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }
    if (this.data.selectMode) {
      api.selectAddress(id)
      back()
      return
    }
    this.edit(id)
  },

  onEdit(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    this.edit(id)
  },

  edit(id: string) {
    go(`/packageOrder/pages/address-edit/address-edit?id=${id}`)
  },

  onAdd() {
    go('/packageOrder/pages/address-edit/address-edit')
  },

  async onDelete(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const accepted = await askConfirm('删除地址', '确定删除该收货地址吗？', '删除')
    if (!accepted) {
      return
    }
    try {
      const addresses = await api.deleteAddress(id)
      this.setData({ addresses })
    } catch (error) {
      showError(error)
    }
  },

  goBack() {
    back()
  },
})
