"""
NextUp-Rank Math Service
FastAPI service implementing BG-1 (Glicko-2) rating calculation.
"""
import math
import os
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NextUp-Rank Math Service", version="1.0.0")

MATH_SERVICE_KEY = os.getenv("MATH_SERVICE_KEY", "")


# ── Auth ─────────────────────────────────────────────────────────────────────

def verify_api_key(x_api_key: str = Header(default="")):
    if MATH_SERVICE_KEY and x_api_key != MATH_SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ── Schema ───────────────────────────────────────────────────────────────────

class RatingRequest(BaseModel):
    rating: float = Field(..., description="Player current rating (Glicko scale)")
    rd: float = Field(..., description="Rating deviation")
    vol: float = Field(..., description="Volatility (sigma)")
    racks_won: int = Field(..., ge=0)
    racks_lost: int = Field(..., ge=0)
    opp_rating: float
    opp_rd: float


class RatingResponse(BaseModel):
    new_rating: float
    new_rd: float
    new_vol: float


# ── Glicko-2 Implementation ───────────────────────────────────────────────────

def calculate_glicko2(rating: float, rd: float, vol: float, results: list) -> tuple:
    """
    Full Glicko-2 calculation per Glickman (2012).
    results: list of (opp_rating, opp_rd, score) where score ∈ [0, 1]
    """
    TAU = 0.5
    EPSILON = 1e-6

    # Convert to Glicko-2 internal scale
    mu = (rating - 1500) / 173.7178
    phi = rd / 173.7178

    if not results:
        phi_star = math.sqrt(phi ** 2 + vol ** 2)
        return rating, phi_star * 173.7178, vol

    # Step 3: compute v and delta
    v_sum = 0.0
    delta_sum = 0.0
    for opp_r, opp_rd_val, s in results:
        mu_j = (opp_r - 1500) / 173.7178
        phi_j = opp_rd_val / 173.7178
        g_phi_j = 1 / math.sqrt(1 + 3 * phi_j ** 2 / math.pi ** 2)
        E = 1 / (1 + math.exp(-g_phi_j * (mu - mu_j)))
        v_sum += g_phi_j ** 2 * E * (1 - E)
        delta_sum += g_phi_j * (s - E)

    v = 1 / v_sum if v_sum > 0 else 1e9
    delta = v * delta_sum

    # Step 5: update volatility (Illinois algorithm)
    a = math.log(vol ** 2)

    def f(x: float) -> float:
        ex = math.exp(x)
        d2 = phi ** 2 + v + ex
        if d2 == 0:
            return 0.0
        return (ex * (delta ** 2 - phi ** 2 - v - ex)) / (2 * d2 ** 2) - (x - a) / TAU ** 2

    A = a
    if delta ** 2 > phi ** 2 + v:
        B = math.log(delta ** 2 - phi ** 2 - v)
    else:
        k = 1
        while f(a - k * TAU) < 0:
            k += 1
        B = a - k * TAU

    fA, fB = f(A), f(B)
    for _ in range(100):
        if abs(B - A) <= EPSILON:
            break
        C = A + (A - B) * fA / (fB - fA)
        fC = f(C)
        if fC * fB <= 0:
            A, fA = B, fB
        else:
            fA /= 2
        B, fB = C, fC

    new_vol = math.exp(A / 2)

    # Steps 6–7: update phi and mu
    phi_star = math.sqrt(phi ** 2 + new_vol ** 2)
    new_phi = 1 / math.sqrt(1 / phi_star ** 2 + 1 / v)
    new_mu = mu + new_phi ** 2 * delta_sum

    new_rating = round(new_mu * 173.7178 + 1500, 2)
    new_rd = new_phi * 173.7178

    return new_rating, new_rd, new_vol


def calculate_match(req: RatingRequest) -> tuple:
    """Convert rack counts to a single Glicko-2 game result and calculate."""
    total = req.racks_won + req.racks_lost
    score = req.racks_won / total if total > 0 else 0.5
    results = [(req.opp_rating, req.opp_rd, score)]
    return calculate_glicko2(req.rating, req.rd, req.vol, results)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/calculate-rating", response_model=RatingResponse)
def calculate_rating(req: RatingRequest, _=Depends(verify_api_key)):
    try:
        new_rating, new_rd, new_vol = calculate_match(req)
        return RatingResponse(new_rating=new_rating, new_rd=new_rd, new_vol=new_vol)
    except ZeroDivisionError:
        raise HTTPException(status_code=422, detail="Division by zero in rating calculation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")
