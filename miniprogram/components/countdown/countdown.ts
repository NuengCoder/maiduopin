import { formatCountdown } from '../../utils/money'

interface CountdownHost {
  _timer?: number
  data: {
    endTime: number
    text: string
  }
  setData: (data: Record<string, unknown>) => void
  triggerEvent: (name: string, detail?: Record<string, unknown>) => void
  tick: () => void
  start: () => void
}

Component({
  properties: {
    endTime: {
      type: Number,
      value: 0,
      observer() {
        ;(this as unknown as CountdownHost).start()
      },
    },
    prefix: {
      type: String,
      value: '',
    },
    theme: {
      type: String,
      value: 'light',
    },
  },

  data: {
    text: '00:00:00',
    expired: false,
  },

  lifetimes: {
    attached() {
      ;(this as unknown as CountdownHost).start()
    },
    detached() {
      const host = this as unknown as CountdownHost
      if (host._timer) {
        clearInterval(host._timer)
        host._timer = undefined
      }
    },
  },

  methods: {
    start() {
      const host = this as unknown as CountdownHost
      if (host._timer) {
        clearInterval(host._timer)
      }
      host.tick()
      host._timer = setInterval(() => {
        host.tick()
      }, 1000)
    },

    tick() {
      const host = this as unknown as CountdownHost
      const endTime = Number(host.data.endTime) || 0
      if (!endTime) {
        host.setData({ text: '00:00:00', expired: false })
        return
      }
      const remain = endTime - Date.now()
      if (remain <= 0) {
        host.setData({ text: '00:00:00', expired: true })
        if (host._timer) {
          clearInterval(host._timer)
          host._timer = undefined
        }
        host.triggerEvent('expire')
        return
      }
      host.setData({ text: formatCountdown(endTime), expired: false })
    },
  },
})
