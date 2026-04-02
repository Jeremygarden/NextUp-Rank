export function getRankInfo(rating) {
  if (rating >= 1900) return { color: '#CCABD8', label: '大师', tier: 5 }
  if (rating >= 1700) return { color: '#FA897B', label: '精英', tier: 4 }
  if (rating >= 1500) return { color: '#FFDD94', label: '黄金', tier: 3 }
  if (rating >= 1300) return { color: '#D0E6A5', label: '进阶', tier: 2 }
  return { color: '#B6E3CE', label: '新手', tier: 1 }
}
