export interface PriceParts {
  integer: string
  decimal: string
}

export const fenToYuan = (fen: number): string => (fen / 100).toFixed(2)

export const yuanToFen = (yuan: number | string): number => {
  const value = typeof yuan === 'string' ? Number(yuan) : yuan
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round(value * 100)
}

export const priceParts = (fen: number): PriceParts => {
  const safe = Math.max(0, Math.round(fen))
  return {
    integer: String(Math.floor(safe / 100)),
    decimal: String(safe % 100).padStart(2, '0'),
  }
}

export const formatSales = (sales: number): string => {
  if (sales >= 10000) {
    return `${(sales / 10000).toFixed(1).replace(/\.0$/, '')}万`
  }
  return String(sales)
}

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export const formatDateShort = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const formatCountdown = (endTime: number): string => {
  const remain = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
  const days = Math.floor(remain / 86400)
  const hours = Math.floor((remain % 86400) / 3600)
  const minutes = Math.floor((remain % 3600) / 60)
  const seconds = remain % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  if (days > 0) {
    return `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export const maskPhone = (phone: string): string => {
  if (phone.length < 7) {
    return phone
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export const orderNo = (): string => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `MDP${stamp}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

export const uid = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
