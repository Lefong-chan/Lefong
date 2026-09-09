// The fixed list of search terms product data is scraped for - shared
// between api/categories.js + api/trending.js (what the site reads) and
// scraper/index.js (what the local scraper bot writes), so the two stay
// in sync without duplicating the list.
//
// 1688 has no simple public "category tree" page reachable from the mobile
// site, and since the app only ever uses a category as a fixed search
// keyword behind a chip (see src/views/Home.vue), a small curated list
// serves the same purpose without scraping one.
export const CATEGORIES = [
  { id: '手机配件', name: 'Phone Accessories' },
  { id: '数码配件', name: 'Digital Accessories' },
  { id: '钥匙扣', name: 'Keychain' },
  { id: '数据线', name: 'USB Cable' },
  { id: '蓝牙耳机', name: 'Bluetooth Earphone' },
  { id: '充电宝', name: 'Power Bank' },
  { id: '手表', name: 'Watch' },
  { id: '太阳镜', name: 'Sunglasses' },
  { id: '背包', name: 'Backpack' },
  { id: '玩具', name: 'Toy' }
]

export const DEFAULT_KEYWORDS = ['phone case', 'keychain', 'usb cable', 'bluetooth earphone', 'power bank', 'memory card', 'watch', 'sunglasses', 'backpack', 'toy']
