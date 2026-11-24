import { api } from '../../../services/api'
import { back, showError, toast } from '../../../utils/ui'

interface AddressForm {
  receiver: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

const EMPTY_FORM: AddressForm = {
  receiver: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: false,
}

Page({
  data: {
    id: '',
    form: { ...EMPTY_FORM },
    saving: false,
  },

  async onLoad(options: Record<string, string>) {
    if (!options.id) {
      return
    }
    try {
      const addresses = await api.getAddresses()
      const address = addresses.find((item) => item.id === options.id)
      if (address) {
        this.setData({
          id: address.id,
          form: {
            receiver: address.receiver,
            phone: address.phone,
            region: address.region,
            detail: address.detail,
            isDefault: address.isDefault,
          },
        })
      }
    } catch (error) {
      showError(error)
    }
  },

  onField(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const field = event.currentTarget.dataset.field as keyof AddressForm
    if (!field) {
      return
    }
    this.setData({
      [`form.${field}`]: event.detail.value,
    })
  },

  onDefaultChange(event: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({
      'form.isDefault': event.detail.value,
    })
  },

  async save() {
    const form = this.data.form
    if (!form.receiver.trim()) {
      toast('请填写收货人')
      return
    }
    if (!/^1\d{10}$/.test(form.phone)) {
      toast('请填写正确的手机号')
      return
    }
    if (!form.region.trim()) {
      toast('请填写所在地区')
      return
    }
    if (!form.detail.trim()) {
      toast('请填写详细地址')
      return
    }

    this.setData({ saving: true })
    try {
      await api.saveAddress({
        id: this.data.id || undefined,
        receiver: form.receiver.trim(),
        phone: form.phone,
        region: form.region.trim(),
        detail: form.detail.trim(),
        isDefault: form.isDefault,
      })
      toast('地址已保存', 'success')
      setTimeout(() => back(), 350)
    } catch (error) {
      showError(error)
    } finally {
      this.setData({ saving: false })
    }
  },
})
