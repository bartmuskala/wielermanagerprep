import cloudscraper
from bs4 import BeautifulSoup
import sys

def test_top_competitors(race="omloop-het-nieuwsblad"):
    scraper = cloudscraper.create_scraper()
    url = f"https://www.procyclingstats.com/race/{race}/2026/startlist/top-competitors"
    print(f"Fetching {url}")
    res = scraper.get(url)
    
    if res.status_code != 200:
        # Fallback to 2025
        print(f"Failed 2026 ({res.status_code}), trying 2025...")
        url = f"https://www.procyclingstats.com/race/{race}/2025/startlist/top-competitors"
        res = scraper.get(url)
        
    if res.status_code != 200:
        print("Failed to fetch.")
        return

    soup = BeautifulSoup(res.text, 'html.parser')
    
    print("Looking for riders...")
    # Usually they are in an ordered list or table
    # The new UI usually has a list of li elements or a table
    table = soup.select_one('table.basic')
    if table:
        print("Found table.basic")
        for tr in table.find_all('tr')[:10]:
            print([td.text.strip().replace('\n', ' ') for td in tr.find_all(['th', 'td'])])
            a_tags = tr.find_all('a')
            for a in a_tags:
                if 'rider/' in a.get('href', ''):
                    print(f"  Rider link: {a['href']}")
    else:
        print("No table.basic found.")
        ul = soup.select_one('ul.list')
        if ul:
            for li in ul.find_all('li')[:10]:
                print(li.text.strip())
        else:
            with open("top_comp.html", "w") as f:
                f.write(res.text)
            print("Saved HTML to top_comp.html. Need to parse.")

if __name__ == "__main__":
    test_top_competitors()
    print("---")
    test_top_competitors("kuurne-brussel-kuurne") # test the spelling user provided
    print("---")
    test_top_competitors("strade-bianche")
