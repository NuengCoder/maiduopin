Component({
  properties: {
    product: {
      type: Object,
      value: {},
    },
  },

  methods: {
    onTap() {
      const product = this.data.product as { id?: string }
      if (!product || !product.id) {
        return
      }
      wx.navigateTo({
        url: `/pages/goods/detail?id=${product.id}`,
      })
    },
  },
})
