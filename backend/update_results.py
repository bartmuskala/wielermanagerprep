import cloudscraper
from bs4 import BeautifulSoup
import json
import time

def get_sporza_points(rank):
    # Standard Sporza classification points (1st to 20th)
    scale = {
        1: 50, 2: 44, 3: 40, 4: 36, 5: 32,
        6: 30, 7: 28, 8: 26, 9: 24, 10: 22,
        11: 20, 12: 18, 13: 16, 14: 14, 15: 12,
        16: 10, 17: 8, 18: 6, 19: 4, 20: 2
    }
    return scale.get(rank, 0)

def update_results():
    db_file = "pcs_data_v3.json"
    try:
        with open(db_file, "r") as f:
            data = json.load(f)
            races = data.get("races", [])
    except Exception as e:
        print(f"Error loading {db_file}: {e}")
        return

    scraper = cloudscraper.create_scraper()
    updated_races = 0

    print("Fetching actual race results...")
    for race in races:
        slug = race["id"]
        url = f"https://www.procyclingstats.com/race/{slug}/2026/result"
        res = scraper.get(url)
        
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            table = soup.select_one('table.basic.results')
            
            if table:
                actual_results = {}
                for tr in table.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 4:
                        try:
                            # Usually the first td is rank, sometimes wrapped
                            rank_text = tds[0].text.strip()
                            if not rank_text.isdigit():
                                continue
                            rank = int(rank_text)
                            
                            if rank > 20: 
                                continue # Only need top 20 for points
                                
                            a_tags = tr.find_all('a')
                            for a in a_tags:
                                if 'rider/' in a['href']:
                                    rider_slug = a['href'].replace('rider/', '').split('/')[0]
                                    pts = get_sporza_points(rank)
                                    actual_results[rider_slug] = {"rank": rank, "points": pts}
                                    break
                        except Exception as e:
                            pass
                
                if actual_results:
                    print(f"[{race['name']}] Found {len(actual_results)} actual finishers!")
                    race["actual_results"] = actual_results
                    race["is_completed"] = True
                    updated_races += 1
                else:
                    print(f"[{race['name']}] Page loaded but no results parsed (maybe race hasn't finished).")
            else:
                print(f"[{race['name']}] No results table found.")
        else:
            print(f"[{race['name']}] Results page returning 404 (Race in future).")
            race["is_completed"] = False
            race["actual_results"] = {}
            
        time.sleep(0.5)

    if updated_races > 0:
        with open(db_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Successfully updated {updated_races} races with live completed results!")
    else:
        print("No races have completed results yet. Database unchanged.")

if __name__ == "__main__":
    update_results()
