import { api } from '../services/api'

Component({
  data: {
    selected: 0,
    cartCount: 0,
    list: [
      { key: 'home', icon: '首', text: '首页', path: '/pages/home/home' },
      { key: 'category', icon: '类', text: '分类', path: '/pages/category/category' },
      { key: 'cart', icon: '车', text: '购物车', path: '/pages/cart/cart' },
      { key: 'profile', icon: '我', text: '我的', path: '/pages/profile/profile' },
    ],
  },

  lifetimes: {
    attached() {
      this.refresh()
    },
  },

  methods: {
    refresh(selected?: number) {
      // Pages call this from onShow; skip the bridge round-trip when nothing
      // actually changed.
      const next = {
        selected: typeof selected === 'number' ? selected : this.data.selected,
        cartCount: api.getCartCount(),
      }
      if (next.selected === this.data.selected && next.cartCount === this.data.cartCount) {
        return
      }
      this.setData(next)
    },

    switchTab(event: WechatMiniprogram.TouchEvent) {
      const { index, path } = event.currentTarget.dataset as {
        index: number
        path: string
      }
      this.setData({ selected: Number(index) })
      wx.switchTab({ url: path })
    },
  },
})
