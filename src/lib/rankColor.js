/**
 * getRankInfo — maps a rating to a rank label, color, and tier (1–8).
 *
 * Rank table (8 tiers):
 *  1  入门   < 1100    green
 *  2  爱好   1100–1299 light-green
 *  3  白银   1300–1399 silver-gray
 *  4  进阶   1400–1499 blue
 *  5  黄金   1500–1699 gold       ← initial rating lands here
 *  6  精英   1700–1899 orange-red
 *  7  大师   1900–2199 purple
 *  8  王者   ≥ 2200    platinum
 */
export function getRankInfo(rating) {
  if (rating >= 2200) return { color: '#E2E8F0', label: '王者', tier: 8, emoji: '👑' }
  if (rating >= 1900) return { color: '#CCABD8', label: '大师', tier: 7, emoji: '🏆' }
  if (rating >= 1700) return { color: '#FA897B', label: '精英', tier: 6, emoji: '💎' }
  if (rating >= 1500) return { color: '#FFDD94', label: '黄金', tier: 5, emoji: '🥇' }
  if (rating >= 1400) return { color: '#93C5FD', label: '进阶', tier: 4, emoji: '🔵' }
  if (rating >= 1300) return { color: '#CBD5E1', label: '白银', tier: 3, emoji: '🥈' }
  if (rating >= 1100) return { color: '#86EFAC', label: '爱好', tier: 2, emoji: '🎱' }
  return                      { color: '#6EE7B7', label: '入门', tier: 1, emoji: '🌱' }
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
