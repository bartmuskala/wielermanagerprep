from bs4 import BeautifulSoup
import re

def parse_html():
    with open("wout.html", "r") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    
    # Name
    title_h1 = soup.find('h1')
    name = title_h1.text.strip().replace('»', '').strip() if title_h1 else "Unknown"
    print(f"Name: {name}")

    # Team
    team_h2 = soup.select_one('.page-title .subtitle h2')
    team = team_h2.text.strip() if team_h2 else "Unknown"
    print(f"Team: {team}")

    # Expertise
    expertise = { "sprint": 0, "cobbles": 0, "hills": 0, "one_day": 0, "gc": 0, "tt": 0 }
    
    # 2 ways they might appear. If it's the large bars under features:
    # Actually wait, in my grep output I see the classes are generic `a` tags or `div.xtitle`.
    xtitles = soup.find_all('div', class_='xtitle')
    for xt in xtitles:
        label = xt.text.lower().strip().replace(' ', '')
        # value is usually previous sibling div class 'xvalue'
        val_div = xt.find_previous_sibling('div', class_='xvalue')
        if val_div:
            try:
                val = int(val_div.text.strip())
                if 'oneday' in label: expertise['one_day'] = max(expertise['one_day'], val)
                elif 'gc' in label: expertise['gc'] = max(expertise['gc'], val)
                elif 'tt' in label or 'time' in label: expertise['tt'] = max(expertise['tt'], val)
                elif 'sprint' in label: expertise['sprint'] = max(expertise['sprint'], val)
                elif 'climb' in label or 'hill' in label: expertise['hills'] = max(expertise['hills'], val)
                elif 'cobble' in label: expertise['cobbles'] = max(expertise['cobbles'], val)
            except:
                pass
                
    # Scale them down a bit as PCS career points can be thousands
    # Normal PCS Expertise bars are 0-100 percentages. These are career points on the new UI actually.
    # Wout has 7895 one day points. Let's scale by dividing by 100 roughly, maxing at 100.
    for k in expertise:
        expertise[k] = min(100, int(expertise[k] / 50))
        
    print(f"Expertise: {expertise}")

    # Points
    uci_points = 0.0
    season_sum = soup.select_one('.rdrSeasonSum')
    if season_sum:
        text = season_sum.text
        print("Season sum text:", text)
        m = re.search(r'UCI points:\s*(\d+)', text)
        if m:
            uci_points = float(m.group(1))
    print(f"UCI Points: {uci_points}")
    
    # Wins
    wins = []
    # In table class="rdrResults" we look for 1st place
    res_table = soup.select_one('table.rdrResults')
    if res_table:
        for tr in res_table.find_all('tr'):
            tds = tr.find_all('td')
            if len(tds) >= 5:
                # 2nd td is usually result #
                res_pos = tds[1].text.strip()
                if '1' == res_pos: # exactly '1'
                    race_a = tds[4].find('a')
                    if race_a:
                        wins.append(race_a.text.strip())
                        
    # Only keep unique consecutive wins up to 10
    unique_wins = list(dict.fromkeys(wins))[:10]
    print(f"Wins: {unique_wins}")

if __name__ == "__main__":
    parse_html()
