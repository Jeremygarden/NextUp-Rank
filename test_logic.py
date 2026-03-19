import unittest
from math_prototype import BilliardGlicko

class TestBilliardGlicko(unittest.TestCase):
    def setUp(self):
        self.bg = BilliardGlicko()

    def test_s_adj_sensitivity(self):
        """
        验证 7:0 完胜与 7:6 险胜的数值差异
        """
        s_7_0 = self.bg.calculate_s_adj(7, 0)
        s_7_6 = self.bg.calculate_s_adj(7, 6)
        
        print(f"\n[Test S_adj Sensitivity]")
        print(f"7:0 Win -> S_adj: {s_7_0:.3f}")
        print(f"7:6 Win -> S_adj: {s_7_6:.3f}")
        
        self.assertEqual(s_7_0, 1.0)
        self.assertAlmostEqual(s_7_6, 0.538, places=3)
        self.assertTrue(s_7_0 > s_7_6)

    def test_rating_gain_difference(self):
        """
        验证在相同初始状态下，完胜获得的积分远高于险胜
        """
        # Case: 500 vs 500, RD 50, Vol 0.06
        r_before, rd_before, vol_before = 500, 50, 0.06
        
        # 7:0 Win
        r_new_1, _, _ = self.bg.update_rating(r_before, rd_before, vol_before, 7, 0, 500, 50)
        gain_1 = r_new_1 - r_before
        
        # 7:6 Win
        r_new_2, _, _ = self.bg.update_rating(r_before, rd_before, vol_before, 7, 6, 500, 50)
        gain_2 = r_new_2 - r_before
        
        print(f"\n[Test Rating Gain]")
        print(f"Initial: 500 | Opponent: 500")
        print(f"7:0 Win -> New Rating: {r_new_1} (Gain: +{gain_1:.2f})")
        print(f"7:6 Win -> New Rating: {r_new_2} (Gain: +{gain_2:.2f})")
        
        self.assertTrue(gain_1 > gain_2 * 10) # 完胜的增益应远大于险胜

    def test_rd_decay(self):
        """
        验证长时间不打球 RD 会增加（不确定性增加）
        """
        rd_initial = 50
        vol = 0.06
        days = 30
        
        rd_new = self.bg.apply_rd_decay(rd_initial, vol, days)
        print(f"\n[Test RD Decay]")
        print(f"Initial RD: {rd_initial}")
        print(f"After {days} days inactive -> New RD: {rd_new:.2f}")
        
        self.assertTrue(rd_new > rd_initial)
        self.assertTrue(rd_new <= 350.0)

if __name__ == '__main__':
    unittest.main()
