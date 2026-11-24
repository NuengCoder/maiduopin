import { fenToYuan, priceParts } from '../../utils/money'

Component({
  properties: {
    fen: {
      type: Number,
      value: 0,
      observer(value: number) {
        const parts = priceParts(value)
        this.setData({
          integer: parts.integer,
          decimal: parts.decimal,
        })
      },
    },
    marketFen: {
      type: Number,
      value: 0,
      observer(value: number) {
        this.setData({
          marketText: value > 0 ? fenToYuan(value) : '',
        })
      },
    },
    size: {
      type: String,
      value: 'md',
    },
    showMarket: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    integer: '0',
    decimal: '00',
    marketText: '',
  },
})
