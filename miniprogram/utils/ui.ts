export const toast = (title: string, icon: 'none' | 'success' | 'error' = 'none'): void => {
  wx.showToast({ title, icon, duration: 1800 })
}

export const showError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error)
  toast(message || '操作失败，请稍后重试')
}

export const go = (url: string): void => {
  wx.navigateTo({ url })
}

export const redirect = (url: string): void => {
  wx.redirectTo({ url })
}

export const switchTab = (url: string): void => {
  wx.switchTab({ url })
}

export const back = (delta = 1): void => {
  wx.navigateBack({ delta })
}

export const askConfirm = (title: string, content: string, confirmText = '确定'): Promise<boolean> =>
  new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText: '取消',
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
