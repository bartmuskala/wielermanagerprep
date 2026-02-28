import pulp
from pydantic import BaseModel
from typing import List, Dict, Optional

class Rider(BaseModel):
    id: str
    name: str
    team: str
    price: float
    expected_points: Dict[str, float]  # race_id -> points

class Race(BaseModel):
    id: str
    name: str
    date: str
    type: str

class SolverRequest(BaseModel):
    riders: List[Rider]
    races: List[Race]
    max_transfers: int = 4
    budget: float = 40.0
    team_size: int = 20
    race_squad_size: int = 12

def solve_team(req: SolverRequest):
    # Setup problem
    prob = pulp.LpProblem("Wielermanager_Optimization", pulp.LpMaximize)

    # Indices
    R = [r.id for r in req.riders]
    C = [c.id for c in req.races]
    N = len(C)

    # Dictionaries for quick lookup
    prices = {r.id: r.price for r in req.riders}
    points = {r.id: r.expected_points for r in req.riders}

    # Variables
    # in_team[r][c] = 1 if rider r is in the 20-man squad at race c (0-indexed races)
    in_team = pulp.LpVariable.dicts("in_team", (R, C), cat="Binary")
    
    # selected[r][c] = 1 if rider r is in the 12-man starting squad for race c
    selected = pulp.LpVariable.dicts("selected", (R, C), cat="Binary")
    
    # transfer_in[r][c] = 1 if rider r is transferred IN just before race c (c >= 1)
    transfer_in = pulp.LpVariable.dicts("transfer_in", (R, C[1:]), cat="Binary")
    
    # transfer_out[r][c] = 1 if rider r is transferred OUT just before race c (c >= 1)
    transfer_out = pulp.LpVariable.dicts("transfer_out", (R, C[1:]), cat="Binary")

    # fees[c] = total transfer fees paid up to race c
    fees = pulp.LpVariable.dicts("fees", C, lowBound=0, cat="Continuous")

    # Objective: maximize expected points of selected riders across all races
    prob += pulp.lpSum(points[r].get(c, 0.0) * selected[r][c] for r in R for c in C), "TotalExpectedPoints"

    # Constraints for Race 0 (Initial Squad)
    c0 = C[0]
    prob += pulp.lpSum(in_team[r][c0] for r in R) == req.team_size, "Initial_Team_Size"
    prob += pulp.lpSum(prices[r] * in_team[r][c0] for r in R) <= req.budget, "Initial_Budget"
    prob += pulp.lpSum(selected[r][c0] for r in R) == req.race_squad_size, f"Squad_Size_{c0}"
    for r in R:
        prob += selected[r][c0] <= in_team[r][c0], f"Must_own_{r}_{c0}"

    # No transfers before Race 0, so fee[c0] = 0
    prob += fees[c0] == 0, "Fee_Initial"

    # Constraints for subsequent races
    for i in range(1, N):
        prev_c = C[i-1]
        curr_c = C[i]

        # 1. Total team size is still 20
        prob += pulp.lpSum(in_team[r][curr_c] for r in R) == req.team_size, f"Team_Size_{curr_c}"

        # 2. Total active squad size is 12
        prob += pulp.lpSum(selected[r][curr_c] for r in R) == req.race_squad_size, f"Squad_Size_{curr_c}"

        # Transfers balance: IN must equal OUT
        prob += pulp.lpSum(transfer_in[r][curr_c] for r in R) == pulp.lpSum(transfer_out[r][curr_c] for r in R), f"Transfer_Balance_{curr_c}"

        # Calculate cumulated transfers logically up to this race
        cum_transfers = pulp.lpSum(transfer_in[r][c] for r in R for c in C[1:i+1])

        # Fees calculation (Fee = max(0, cum_transfers - 3))
        prob += fees[curr_c] >= 0, f"Fee_Positive_{curr_c}"
        prob += fees[curr_c] >= cum_transfers - 3, f"Fee_Formula_{curr_c}"

        # Budget constraint at this race
        current_team_cost = pulp.lpSum(prices[r] * in_team[r][curr_c] for r in R)
        prob += current_team_cost + fees[curr_c] <= req.budget, f"Budget_{curr_c}"

        for r in R:
            # Cannot select unowned riders
            prob += selected[r][curr_c] <= in_team[r][curr_c], f"Must_own_{r}_{curr_c}"

            # Ownership evolution
            prob += in_team[r][curr_c] == in_team[r][prev_c] + transfer_in[r][curr_c] - transfer_out[r][curr_c], f"Evolution_{r}_{curr_c}"

            # Can only transfer in if not already in team
            prob += transfer_in[r][curr_c] <= 1 - in_team[r][prev_c], f"Max_Transfer_In_{r}_{curr_c}"

            # Can only transfer out if currently in team
            prob += transfer_out[r][curr_c] <= in_team[r][prev_c], f"Max_Transfer_Out_{r}_{curr_c}"

    # Global Max Transfers constraint
    prob += pulp.lpSum(transfer_in[r][c] for r in R for c in C[1:]) <= req.max_transfers, "Max_Global_Transfers"

    # Solve the problem
    prob.solve(pulp.PULP_CBC_CMD(msg=False, timeLimit=60))

    if pulp.LpStatus[prob.status] != "Optimal":
        return {"status": pulp.LpStatus[prob.status], "error": "Could not find optimal solution"}

    # Extract results
    solution = {
        "status": "Optimal",
        "total_points": pulp.value(prob.objective),
        "races": []
    }

    # For each race, extract the 20-man team and 12-man starting lineup
    for i, c in enumerate(C):
        race_team = [r for r in R if pulp.value(in_team[r][c]) == 1]
        race_selected = [r for r in R if pulp.value(selected[r][c]) == 1]
        
        team_cost = sum(prices[r] for r in race_team)
        fee_paid = pulp.value(fees[c])
        remaining_budget = req.budget - team_cost - fee_paid
        
        transfers_in = [r for r in R if i > 0 and pulp.value(transfer_in[r][c]) == 1]
        transfers_out = [r for r in R if i > 0 and pulp.value(transfer_out[r][c]) == 1]

        solution["races"].append({
            "race_id": c,
            "team": race_team,
            "selected": race_selected,
            "transfers_in": transfers_in,
            "transfers_out": transfers_out,
            "budget_used": team_cost,
            "fees_paid": fee_paid,
            "remaining_budget": remaining_budget
        })

    return solution
