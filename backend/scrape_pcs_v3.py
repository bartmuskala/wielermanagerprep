import cloudscraper
from bs4 import BeautifulSoup
import json
import time
import re

def get_points_for_rank(rank):
    # #1 has more weight than #2 and #3, etc.
    scale = {
        1: 100, 2: 80, 3: 70, 4: 60, 5: 50,
        6: 45,  7: 40, 8: 35, 9: 30, 10: 25,
        11: 20, 12: 18, 13: 16, 14: 14, 15: 12,
        16: 10, 17: 9, 18: 8, 19: 7, 20: 6
    }
    return scale.get(rank, 1) # Everyone else gets 1 point for being identified as a competitor

def filter_men_spring_classics(scraper):
    return [
        {"id": "omloop-het-nieuwsblad", "year": "2026", "date": "Feb 28", "class": "1.UWT", "name": "Omloop Nieuwsblad"},
        {"id": "kuurne-brussel-kuurne", "year": "2026", "date": "Mar 01", "class": "1.Pro", "name": "Kuurne - Brussel - Kuurne"},
        {"id": "le-samyn", "year": "2026", "date": "Mar 03", "class": "1.1", "name": "Samyn Classic"},
        {"id": "strade-bianche", "year": "2026", "date": "Mar 07", "class": "1.UWT", "name": "Strade Bianche"},
        {"id": "nokere-koerse", "year": "2026", "date": "Mar 18", "class": "1.Pro", "name": "Nokere Koerse"},
        {"id": "bredene-koksijde-classic", "year": "2026", "date": "Mar 20", "class": "1.Pro", "name": "Bredene - Koksijde Classic"},
        {"id": "milano-sanremo", "year": "2026", "date": "Mar 21", "class": "1.UWT", "name": "Milaan - Sanremo"},
        {"id": "classic-brugge-de-panne", "year": "2026", "date": "Mar 25", "class": "1.UWT", "name": "Ronde van Brugge"},
        {"id": "e3-harelbeke", "year": "2026", "date": "Mar 27", "class": "1.UWT", "name": "E3 Saxo Classic"},
        {"id": "gent-wevelgem", "year": "2026", "date": "Mar 29", "class": "1.UWT", "name": "In Flanders Fields"},
        {"id": "dwars-door-vlaanderen", "year": "2026", "date": "Apr 01", "class": "1.UWT", "name": "Dwars door Vlaanderen"},
        {"id": "ronde-van-vlaanderen", "year": "2026", "date": "Apr 05", "class": "1.UWT", "name": "Ronde van Vlaanderen"},
        {"id": "scheldeprijs", "year": "2026", "date": "Apr 08", "class": "1.Pro", "name": "Scheldeprijs"},
        {"id": "paris-roubaix", "year": "2026", "date": "Apr 12", "class": "1.UWT", "name": "Parijs - Roubaix"},
        {"id": "ronde-van-limburg", "year": "2026", "date": "Apr 15", "class": "1.1", "name": "Ronde van Limburg"},
        {"id": "brabantse-pijl", "year": "2026", "date": "Apr 17", "class": "1.Pro", "name": "Brabantse Pijl"},
        {"id": "amstel-gold-race", "year": "2026", "date": "Apr 19", "class": "1.UWT", "name": "Amstel Gold Race"},
        {"id": "la-fleche-wallonne", "year": "2026", "date": "Apr 22", "class": "1.UWT", "name": "Waalse Pijl"},
        {"id": "liege-bastogne-liege", "year": "2026", "date": "Apr 26", "class": "1.UWT", "name": "Luik - Bastenaken - Luik"},
    ]

def fetch_top_competitors(scraper, race_slug):
    url = f"https://www.procyclingstats.com/race/{race_slug}/2026/startlist/top-competitors"
    res = scraper.get(url)
    
    # Fallback to 2025 if new year not populated
    if res.status_code != 200:
        url2025 = f"https://www.procyclingstats.com/race/{race_slug}/2025/startlist/top-competitors"
        res = scraper.get(url2025)
        
    if res.status_code != 200:
        return []

    soup = BeautifulSoup(res.text, 'html.parser')
    competitors = []
    
    table = soup.select_one('table.basic')
    if table:
        for tr in table.find_all('tr'):
            tds = tr.find_all('td')
            if len(tds) >= 2:
                try:
                    rank = int(tds[0].text.strip())
                    a_tags = tr.find_all('a')
                    for a in a_tags:
                        if 'rider/' in a['href']:
                            rider_slug = a['href'].replace('rider/', '').split('/')[0]
                            competitors.append({"slug": rider_slug, "rank": rank})
                            break
                except:
                    pass
    return competitors

def fetch_startlist(scraper, race_slug):
    url = f"https://www.procyclingstats.com/race/{race_slug}/2026/startlist"
    res = scraper.get(url)
    if res.status_code != 200:
        url = f"https://www.procyclingstats.com/race/{race_slug}/2025/startlist"
        res = scraper.get(url)
        
    if res.status_code != 200:
        return []
        
    soup = BeautifulSoup(res.text, 'html.parser')
    starts = []
    links = soup.find_all('a', href=True)
    for a in links:
        if a['href'].startswith('rider/') and len(a['href'].split('/')) == 2:
            rider_slug = a['href'].replace('rider/', '')
            starts.append(rider_slug)
    return list(set(starts))


def scrape():
    scraper = cloudscraper.create_scraper()
    races = filter_men_spring_classics(scraper)
    print(f"Found {len(races)} male spring classics.")
    
    all_riders_data = {}
    
    for race in races:
        print(f"Processing {race['name']}...")
        startids = fetch_startlist(scraper, race['id'])
        top_comps = fetch_top_competitors(scraper, race['id'])
        
        race['starters'] = startids
        
        # Initialize riders
        for r_id in startids:
            if r_id not in all_riders_data:
                all_riders_data[r_id] = {
                    "id": r_id,
                    "name": r_id.replace('-', ' ').title(),
                    "global_score": 0,
                    "starts": [],
                    "top_ranks": {}
                }
            all_riders_data[r_id]["starts"].append(race['id'])
            
        # Add points
        for tc in top_comps:
            r_slug = tc['slug']
            rank = tc['rank']
            pts = get_points_for_rank(rank)
            
            # It's possible a top competitor isn't strictly parsed in startlist due to page structure
            if r_slug not in all_riders_data:
                 all_riders_data[r_slug] = {
                    "id": r_slug,
                    "name": r_slug.replace('-', ' ').title(),
                    "global_score": 0,
                    "starts": [race['id']],
                    "top_ranks": {}
                 }
                 
            all_riders_data[r_slug]["global_score"] += pts
            all_riders_data[r_slug]["top_ranks"][race['id']] = rank
            
        time.sleep(0.5)

    # Convert to list and sort by global score descending
    riders_list = list(all_riders_data.values())
    riders_list.sort(key=lambda x: x['global_score'], reverse=True)
    
    # Filter to only riders who have a global score > 0
    scored_riders = [r for r in riders_list if r["global_score"] > 0]
    
    print("\n--- FINAL SCORED SQUAD ---")
    print(f"Total riders with points: {len(scored_riders)}")

    with open('../webapp/api/pcs_data_v3.json', 'w') as f:
        json.dump({
            "riders": scored_riders,
            "races": races
        }, f, indent=2)
        
    print("Scraping complete. Saved to ../webapp/api/pcs_data_v3.json.")

if __name__ == "__main__":
    scrape()
