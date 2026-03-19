import math
import numpy as np

class BilliardGlicko:
    """
    Billiard-Glicko (BG-1) Implementation
    Based on Glicko-2 with Rack-level Score Adjustment (S_adj).
    """
    def __init__(self, tau=0.5):
        self.tau = tau  # Constrains volatility changes over time

    def _g(self, phi):
        return 1.0 / math.sqrt(1.0 + 3.0 * (phi**2) / (math.pi**2))

    def _E(self, mu, mu_j, phi_j):
        return 1.0 / (1.0 + math.exp(-self._g(phi_j) * (mu - mu_j)))

    def _f(self, x, delta, phi, v, a, tau):
        """
        Glicko-2 Volatility iteration function f(x)
        """
        ex = math.exp(x)
        num = ex * (delta**2 - phi**2 - v - ex)
        den = 2 * (phi**2 + v + ex)**2
        return num / den - (x - a) / (tau**2)

    def calculate_new_vol(self, delta, phi, v, vol, tau):
        """
        Illinois algorithm (Numerical iteration) for Glicko-2 Volatility sigma'
        This is the standard iterative solver for volatility.
        """
        a = math.log(vol**2)
        A = a
        if delta**2 > phi**2 + v:
            B = math.log(delta**2 - phi**2 - v)
        else:
            k = 1
            while self._f(a - k * tau, delta, phi, v, a, tau) < 0:
                k += 1
            B = a - k * tau

        fA = self._f(A, delta, phi, v, a, tau)
        fB = self._f(B, delta, phi, v, a, tau)

        epsilon = 0.000001
        while abs(B - A) > epsilon:
            C = A + (A - B) * fA / (fB - fA)
            fC = self._f(C, delta, phi, v, a, tau)
            if fC * fB < 0:
                A = B
                fA = fB
            else:
                fA = fA / 2
            B = C
            fB = fC

        return math.exp(A / 2)

    def apply_rd_decay(self, rd, vol, days_since_last_match):
        """
        Glicko-2 RD Decay: 
        phi' = sqrt(phi^2 + vol^2 * t)
        where t is the time elapsed since last match.
        """
        phi = rd / 173.7178
        phi_star = math.sqrt(phi**2 + (vol**2) * days_since_last_match)
        return min(350.0, phi_star * 173.7178)

    def calculate_s_adj(self, racks_won, racks_lost):
        """
        Custom improvement over FargoRate: 
        Converts Rack-level score into a continuous probability win value [0, 1].
        Formula: S_adj = 0.5 + ((W - L) / (W + L)) * 0.5
        """
        total = racks_won + racks_lost
        if total == 0: return 0.5
        s_adj = 0.5 + ((racks_won - racks_lost) / total) * 0.5
        return s_adj

    def calculate_memory_weight(self, match_index, total_matches=25, lam=0.1):
        """
        Real-time Display Weighting: omega_i = e^{-lambda * (total - i)}
        Gives higher weight to recent matches.
        """
        return math.exp(-lam * (total_matches - match_index))

    def update_rating(self, rating, rd, vol, racks_won, racks_lost, opp_rating, opp_rd):
        # 1. Convert to Glicko-2 Scale
        mu = (rating - 1500) / 173.7178
        phi = rd / 173.7178
        
        mu_j = (opp_rating - 1500) / 173.7178
        phi_j = opp_rd / 173.7178
        
        # 2. Get adjusted score S
        s_adj = self.calculate_s_adj(racks_won, racks_lost)
        
        # 3. Computing Variance (v) and Delta
        g_phi_j = self._g(phi_j)
        e_val = self._E(mu, mu_j, phi_j)
        v = 1.0 / (g_phi_j**2 * e_val * (1.0 - e_val))
        delta = v * (g_phi_j * (s_adj - e_val))
        
        # 4. Volatility update (Standard Glicko-2 Illinois Algorithm)
        new_vol = self.calculate_new_vol(delta, phi, v, vol, self.tau)
        
        # 5. Rating and RD update
        phi_star = math.sqrt(phi**2 + new_vol**2)
        new_phi = 1.0 / math.sqrt(1.0 / phi_star**2 + 1.0 / v)
        new_mu = mu + new_phi**2 * (g_phi_j * (s_adj - e_val))
        
        # 6. Convert back to original scale
        new_rating = 173.7178 * new_mu + 1500
        new_rd = 173.7178 * new_phi
        
        return round(new_rating, 2), round(new_rd, 2), round(new_vol, 5)

# Example Usage:
# Player A (500, 50, 0.06) vs Player B (480, 50, 0.06)
# Match result: 7-4
bg = BilliardGlicko()
res = bg.update_rating(500, 50, 0.06, 7, 4, 480, 50)
print(f"New Rating: {res[0]}, New RD: {res[1]}, New Vol: {res[2]}")
