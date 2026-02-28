from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

app = FastAPI(title="Wielermanager Optimization API v3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_data():
    try:
        with open("pcs_data_v3.json", "r") as f:
            data = json.load(f)
            return data.get("riders", []), data.get("races", [])
    except Exception as e:
        print("Warning: Could not load pcs_data_v3.json.")
        return [], []

@app.get("/api/riders")
def get_riders():
    RIDERS_DB, _ = load_data()
    return RIDERS_DB

@app.get("/api/races")
def get_races():
    _, RACES_DB = load_data()
    return RACES_DB

@app.post("/api/solve")
def solve_endpoint():
    """
    Returns the ultimate 30-man squad (which is pre-calculated by the scraper).
    For each race, selects the top 12 available riders from the 30-man squad
    based strictly on their specific Top Competitor rank in that race.
    """
    RIDERS_DB, RACES_DB = load_data()
    if not RIDERS_DB:
        return {"error": "No rider data available"}
        
    squad_ids = [r['id'] for r in RIDERS_DB] # Exactly the top 30
    total_score = sum(r.get('global_score', 0) for r in RIDERS_DB)
    
    solution = {
        "status": "Optimal",
        "total_points": total_score,
        "squad_riders": squad_ids,
        "races": []
    }
    
    for race in RACES_DB:
        race_id = race['id']
        
        # 1. Filter the 30-man squad to riders who actually start this race
        starters = [r for r in RIDERS_DB if race_id in r.get('starts', [])]
        
        # 2. Sort by their top_ranks for this specific race
        # Lowest rank number is best. If they aren't explicitly ranked on top_competitors, give them 999.
        def get_rank(rider):
            ranks = rider.get('top_ranks', {})
            return ranks.get(race_id, 999)
            
        starters.sort(key=get_rank)
        
        # 3. Take top 12
        selected_riders = [r['id'] for r in starters[:12]]
        
        solution["races"].append({
            "race_id": race_id,
            "selected": selected_riders,
        })
        
    return solution

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
