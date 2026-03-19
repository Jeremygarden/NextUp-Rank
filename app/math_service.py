from fastapi import FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
import os
from math_prototype import BilliardGlicko

app = FastAPI(title="NextUp-Rank Math Service")
bg = BilliardGlicko()

# Security: Simple API Key check
API_KEY = os.getenv("MATH_SERVICE_KEY", "your-secret-key")
api_key_header = APIKeyHeader(name="X-API-KEY")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key

class RatingRequest(BaseModel):
    rating: float
    rd: float
    vol: float
    racks_won: int
    racks_lost: int
    opp_rating: float
    opp_rd: float

@app.post("/calculate-rating")
async def calculate(data: RatingRequest, api_key: str = Security(get_api_key)):
    try:
        new_r, new_rd, new_v = bg.update_rating(
            data.rating, data.rd, data.vol,
            data.racks_won, data.racks_lost,
            data.opp_rating, data.opp_rd
        )
        return {
            "new_rating": new_r,
            "new_rd": new_rd,
            "new_vol": new_v
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
