import { api } from './services/api'

App<IAppOption>({
  globalData: {
    cartCount: 0,
  },

  onLaunch() {
    api.ensureSeed()
  },

  onError(error: string) {
    console.error('[app:onError]', error)
  },

  onUnhandledRejection(res: WechatMiniprogram.OnUnhandledRejectionCallbackResult) {
    console.error('[app:onUnhandledRejection]', res.reason)
  },
})
