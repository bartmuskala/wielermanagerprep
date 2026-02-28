import cloudscraper
from bs4 import BeautifulSoup
import json
import time
import re

# Top 10 classics
RACES = [
    {"id": "omloop-het-nieuwsblad", "year": "2026", "name": "Omloop Nieuwsblad"},
    {"id": "kuurne-brussels-kuurne", "year": "2026", "name": "Kuurne-Brussel-Kuurne"},
    {"id": "le-samyn", "year": "2026", "name": "Le Samyn"},
    {"id": "strade-bianche", "year": "2026", "name": "Strade Bianche"},
    {"id": "nokere-koerse", "year": "2026", "name": "Nokere Koerse"},
    {"id": "bredene-koksijde-classic", "year": "2026", "name": "Bredene Koksijde Classic"},
    {"id": "milano-sanremo", "year": "2026", "name": "Milano-Sanremo"},
    {"id": "classic-brugge-de-panne", "year": "2026", "name": "Classic Brugge-De Panne"},
    {"id": "e3-harelbeke", "year": "2026", "name": "E3 Saxo Classic"},
    {"id": "gent-wevelgem", "year": "2026", "name": "Gent-Wevelgem"},
]

def fetch_startlists(scraper):
    startlists = {}
    all_riders_found = set()
    
    for race in RACES:
        race_id = race['id']
        year = race['year']
        url = f"https://www.procyclingstats.com/race/{race_id}/{year}/startlist"
        print(f"Fetching {url}")
        
        response = scraper.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            links = soup.find_all('a', href=True)
            riders_in_race = set()
            for a in links:
                if a['href'].startswith('rider/') and len(a['href'].split('/')) == 2:
                    rider_slug = a['href'].replace('rider/', '')
                    riders_in_race.add(rider_slug)
            
            if len(riders_in_race) < 20: 
                print(f"Startlist for {race_id} 2026 not populated. Falling back to 2025.")
                url2025 = f"https://www.procyclingstats.com/race/{race_id}/2025/startlist"
                res2025 = scraper.get(url2025)
                if res2025.status_code == 200:
                    soup25 = BeautifulSoup(res2025.text, 'html.parser')
                    links25 = soup25.find_all('a', href=True)
                    for a in links25:
                        if a['href'].startswith('rider/') and len(a['href'].split('/')) == 2:
                            rider_slug = a['href'].replace('rider/', '')
                            riders_in_race.add(rider_slug)
            
            filtered = list(riders_in_race)
            print(f"Found {len(filtered)} riders for {race_id}")
            startlists[race_id] = filtered
            for r in filtered:
                all_riders_found.add(r)
        else:
            print(f"Failed to fetch {race_id}: {response.status_code}")
        time.sleep(1)
    
    return startlists, list(all_riders_found)

def fetch_rider_profile(scraper, slug):
    url = f"https://www.procyclingstats.com/rider/{slug}"
    print(f"  -> Scraping profile: {slug}")
    res = scraper.get(url)
    
    data = {
        "id": slug,
        "name": slug.replace('-', ' ').title(),
        "team": "Unknown",
        "uci_points": 0.0,
        "expertise": { "sprint": 0, "cobbles": 0, "hills": 0, "one_day": 0, "gc": 0, "tt": 0 },
        "wins": [],
        "strength": 5.0
    }
    
    if res.status_code != 200:
        return data

    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Name
    title_h1 = soup.find('h1')
    if title_h1:
        data["name"] = title_h1.text.strip().replace('»', '').strip()
        
    # Team
    team_h2 = soup.select_one('.page-title .subtitle h2')
    if team_h2:
        data["team"] = team_h2.text.strip()
        
    # UCI Points
    season_sum = soup.select_one('.rdrSeasonSum')
    if season_sum:
        m = re.search(r'UCI points:\s*(\d+)', season_sum.text)
        if m:
            data["uci_points"] = float(m.group(1))

    # Expertise
    xtitles = soup.find_all('div', class_='xtitle')
    if xtitles:
        for xt in xtitles:
            a_tag = xt.find('a')
            if not a_tag:
                continue
            label = a_tag.text.lower().strip().replace(' ', '')
            val_div = xt.find_previous_sibling('div', class_='xvalue')
            if val_div:
                try:
                    val = int(val_div.text.strip())
                    if 'oneday' in label: data['expertise']['one_day'] = max(data['expertise']['one_day'], val)
                    elif 'gc' in label: data['expertise']['gc'] = max(data['expertise']['gc'], val)
                    elif 'tt' in label or 'time' in label: data['expertise']['tt'] = max(data['expertise']['tt'], val)
                    elif 'sprint' in label: data['expertise']['sprint'] = max(data['expertise']['sprint'], val)
                    elif 'climb' in label or 'hill' in label: data['expertise']['hills'] = max(data['expertise']['hills'], val)
                except:
                    pass
        
        # Scale down points out of ~100 max visually, PCS points can be high
        for k in data['expertise']:
            data['expertise'][k] = min(100, int(data['expertise'][k] / 50))
            
        data['expertise']['cobbles'] = data['expertise']['one_day'] # Fallback
            
    # Wins
    res_table = soup.select_one('table.rdrResults')
    if res_table:
        for tr in res_table.find_all('tr'):
            tds = tr.find_all('td')
            if len(tds) >= 5:
                res_pos = tds[1].text.strip()
                if res_pos == '1': # 1st place
                    race_a = tds[4].find('a')
                    if race_a:
                        data["wins"].append(race_a.text.strip())
    
    unique_wins = list(dict.fromkeys(data["wins"]))[:10]
    data["wins"] = unique_wins
    
    # Calculate Strength Matrix
    exp = data["expertise"]
    classic_score = exp['cobbles'] * 1.5 + exp['hills'] * 1.5 + exp['one_day'] * 2.0 + exp['sprint'] * 1.0
    uci_weight = min((data["uci_points"] / 1000) * 15, 45) # Max 45 points from UCI rank
    win_weight = len(data["wins"]) * 5 # Max 50 points from wins recent
    
    raw_strength = classic_score + uci_weight + win_weight
    norm = round(raw_strength / 4.0, 1) # ~100 max theoretical
    if norm < 5.0: norm = 5.0
    data["strength"] = norm
    
    return data

def scrape():
    scraper = cloudscraper.create_scraper()
    
    startlists, unique_riders_slugs = fetch_startlists(scraper)
    final_riders = []
    
    print(f"Need to fetch full profiles for {len(unique_riders_slugs)} riders...")
    count = 0
    for slug in unique_riders_slugs:
        count += 1
        r_data = fetch_rider_profile(scraper, slug)
        
        r_data['starts'] = []
        for race_id, riders_in_race in startlists.items():
            if r_data['id'] in riders_in_race:
                r_data['starts'].append(race_id)
                
        final_riders.append(r_data)
        
        if count % 10 == 0:
            print(f"Processed {count}/{len(unique_riders_slugs)}...")
            # Incremental save just in case
            with open('pcs_data.json', 'w') as f:
                json.dump({"riders": final_riders, "races": RACES}, f, indent=2)
        
        # Super aggressive scraping without huge sleep to finish in this turn
        time.sleep(0.2)

    with open('pcs_data.json', 'w') as f:
        json.dump({
            "riders": final_riders,
            "races": RACES
        }, f, indent=2)

    print(f"Successfully scraped {len(final_riders)} detailed rider profiles!")

if __name__ == "__main__":
    scrape()
