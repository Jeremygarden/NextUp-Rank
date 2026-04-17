/**
 * getRankInfo — maps a rating to a rank label, color, and tier (1–10).
 *
 * Rank table (10 tiers):
 *  1  入门   < 1100    green
 *  2  新手   1100–1199 light-green
 *  3  爱好   1200–1299 teal
 *  4  进阶   1300–1399 blue
 *  5  白银   1400–1499 silver-gray
 *  6  黄金   1500–1699 gold       ← initial rating lands here
 *  7  精英   1700–1899 orange-red
 *  8  大师   1900–2199 purple
 *  9  王者   2200–2399 platinum
 * 10  传奇   ≥ 2400    flame/gold
 */
export function getRankInfo(rating) {
  if (rating >= 2400) return { color: '#FCD34D', label: '传奇', tier: 10, emoji: '🔥' }
  if (rating >= 2200) return { color: '#E2E8F0', label: '王者', tier: 9,  emoji: '👑' }
  if (rating >= 1900) return { color: '#CCABD8', label: '大师', tier: 8,  emoji: '🏆' }
  if (rating >= 1700) return { color: '#FA897B', label: '精英', tier: 7,  emoji: '💎' }
  if (rating >= 1500) return { color: '#FFDD94', label: '黄金', tier: 6,  emoji: '🥇' }
  if (rating >= 1400) return { color: '#CBD5E1', label: '白银', tier: 5,  emoji: '🥈' }
  if (rating >= 1300) return { color: '#93C5FD', label: '进阶', tier: 4,  emoji: '🔵' }
  if (rating >= 1200) return { color: '#6EE7B7', label: '爱好', tier: 3,  emoji: '🎱' }
  if (rating >= 1100) return { color: '#A7F3D0', label: '新手', tier: 2,  emoji: '🆕' }
  return                      { color: '#86EFAC', label: '入门', tier: 1,  emoji: '🌱' }
}

/**
 * getRankGap — returns a warning level based on tier difference between two players.
 * 0 = no warning, 1 = mild (1 tier), 2 = moderate (2 tiers), 3 = large (≥3 tiers)
 */
export function getRankGap(ratingA, ratingB) {
  const tierA = getRankInfo(ratingA).tier
  const tierB = getRankInfo(ratingB).tier
  const diff = Math.abs(tierA - tierB)
  if (diff >= 3) return 3
  if (diff === 2) return 2
  if (diff === 1) return 1
  return 0
}
