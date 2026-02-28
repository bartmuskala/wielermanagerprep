import cloudscraper
from bs4 import BeautifulSoup
import sys

def test_races():
    scraper = cloudscraper.create_scraper()
    url = "https://www.procyclingstats.com/races.php?s=&year=2026&circuit=&class=&filter=Filter"
    print(f"Fetching {url}")
    res = scraper.get(url)
    
    if res.status_code != 200:
        print("Failed to fetch races.")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    table = soup.select_one('table.basic')
    if table:
        print("Found table.basic")
        print("Columns:", [th.text.strip() for th in table.find_all('th')])
        
        rows = table.find_all('tr')
        found_count = 0
        
        for tr in rows:
            tds = tr.find_all('td')
            if len(tds) >= 5: # Date, Date(?), Race, Winner, Class
                date = tds[0].text.strip()
                name_a = tds[2].find('a')
                if not name_a:
                    continue
                race_name = name_a.text.strip()
                race_href = name_a['href']
                race_class = tds[4].text.strip()
                
                # Keep only 1.UWT, 1.Pro in spring (Feb - April, maybe dates 02. - 04.)
                # PCS date format is often dd.mm
                if ('1.UW' in race_class or '1.Pr' in race_class):
                    # Filter for spring classics using simple string checks
                    if any(m in date for m in ['.02', '.03', '.04']):
                        print(f"[{date}] {race_name} ({race_class}) -> {race_href}")
                        found_count += 1
                        
                        if found_count > 30:
                            break

if __name__ == "__main__":
    test_races()
