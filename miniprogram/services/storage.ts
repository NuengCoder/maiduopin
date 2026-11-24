const PREFIX = 'mdp_'

export const STORAGE_KEYS = {
  seeded: `${PREFIX}seeded_v1`,
  user: `${PREFIX}user`,
  cart: `${PREFIX}cart`,
  orders: `${PREFIX}orders`,
  addresses: `${PREFIX}addresses`,
  selectedAddress: `${PREFIX}selected_address`,
  coupons: `${PREFIX}coupons`,
  favorites: `${PREFIX}favorites`,
  groups: `${PREFIX}groups`,
  bargains: `${PREFIX}bargains`,
  selectedCategory: `${PREFIX}selected_category`,
  referral: `${PREFIX}referral`,
} as const

export const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = wx.getStorageSync(key)
    if (value === '' || value === undefined || value === null) {
      return fallback
    }
    return value as T
  } catch (error) {
    console.warn('[storage] read failed', key, error)
    return fallback
  }
}

export const writeStorage = <T>(key: string, value: T): void => {
  try {
    wx.setStorageSync(key, value)
  } catch (error) {
    console.warn('[storage] write failed', key, error)
  }
}

export const removeStorage = (key: string): void => {
  try {
    wx.removeStorageSync(key)
  } catch (error) {
    console.warn('[storage] remove failed', key, error)
  }
}
