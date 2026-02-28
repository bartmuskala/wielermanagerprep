import json
import cloudscraper
from unidecode import unidecode
from thefuzz import fuzz

def normalize_name(name):
    # Remove accents, lowercase, replace hyphens with spaces
    name = unidecode(name).lower()
    name = name.replace('-', ' ')
    import re
    # Remove all non-alphanumeric chars except spaces
    name = re.sub(r'[^a-z0-9\s]', '', name)
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    return name
    
def map_sporza_prices():
    # 1. Load the PCS riders database
    db_file = "../webapp/api/pcs_data_v3.json"
    try:
        with open(db_file, "r") as f:
            data = json.load(f)
            pcs_riders = data.get("riders", {})
    except Exception as e:
        print(f"Error loading {db_file}: {e}")
        return

    # 2. Fetch the Sporza API
    print("Fetching Sporza cyclists...")
    scraper = cloudscraper.create_scraper()
    res = scraper.get("https://wielermanager.sporza.be/api/vrjr-m-26/cyclists")
    
    if res.status_code != 200:
        print(f"Failed to fetch Sporza data. Status code: {res.status_code}")
        return
        
    sporza_data = res.json()
    sporza_cyclists = sporza_data.get("cyclists", [])
    print(f"Fetched {len(sporza_cyclists)} cyclists from Sporza.")

    # Convert Sporza to a searchable list of normalized names
    sporza_dict = {}
    for c in sporza_cyclists:
        norm = normalize_name(c.get("fullName", ""))
        sporza_dict[norm] = c
    
    # We also keep a list for fuzzy matching
    sporza_names = list(sporza_dict.keys())
    
    match_count = 0
    missing = []
    
    # 3. Match 
    for rider_data in pcs_riders:
        # PCS ids are usually like "tadej-pogacar". Names are also stored.
        rider_id = rider_data.get("id")
        pcs_name = normalize_name(rider_data.get("name", rider_id))
        
        # Exact match first
        best_match_key = None
        if pcs_name in sporza_dict:
            best_match_key = pcs_name
        else:
            # Try fuzzy matching if no exact
            best_score = 0
            for sn in sporza_names:
                score = fuzz.token_sort_ratio(pcs_name, sn)
                if score > best_score:
                    best_score = score
                    best_match_key = sn
            
            # Use threshold of 80
            if best_score < 80:
                best_match_key = None
                
        if best_match_key:
            s_data = sporza_dict[best_match_key]
            rider_data["sporza_price"] = s_data.get("price", 0)
            rider_data["sporza_popularity"] = s_data.get("popularity", 0)
            rider_data["sporza_id"] = s_data.get("id")
            rider_data["team_logo"] = s_data.get("team", {}).get("jerseyUrl")
            
            # Calculate ROI
            price = rider_data["sporza_price"]
            score = rider_data.get("global_score", 0)
            if price > 0:
                rider_data["roi"] = round(score / price, 2)
            else:
                rider_data["roi"] = 0
                
            match_count += 1
        else:
            rider_data["sporza_price"] = 0
            rider_data["sporza_popularity"] = 0
            rider_data["roi"] = 0
            missing.append(rider_data.get("name", rider_id))
            
    print(f"Matched {match_count} out of {len(pcs_riders)} PCS riders.")
    print(f"Sample of missing riders: {missing[:10]}")
    
    # 4. Save updated DB
    with open(db_file, "w") as f:
        json.dump(data, f, indent=2)
    print("Database updated.")

if __name__ == "__main__":
    map_sporza_prices()
