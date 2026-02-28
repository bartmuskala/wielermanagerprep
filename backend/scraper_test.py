import cloudscraper
from bs4 import BeautifulSoup

def test_scraper():
    scraper = cloudscraper.create_scraper()  # returns a CloudScraper instance
    url = "https://www.procyclingstats.com/race/omloop-het-nieuwsblad/2026/startlist"
    print(f"Fetching {url}")
    
    response = scraper.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.find('title')
        print("Title:", title.text if title else "No title")
        
        # Look for rider links
        rider_links = [a['href'] for a in soup.find_all('a') if a.has_attr('href') and 'rider/' in a['href']]
        print(f"Found {len(rider_links)} rider links in 2026.")
        
        if not rider_links:
            # Try 2025
            url2025 = "https://www.procyclingstats.com/race/omloop-het-nieuwsblad/2025/startlist"
            print(f"Trying 2025: {url2025}")
            res2025 = scraper.get(url2025)
            print(f"Status Code 2025: {res2025.status_code}")
            if res2025.status_code == 200:
                soup2025 = BeautifulSoup(res2025.text, 'html.parser')
                riders_2025 = [a['href'] for a in soup2025.find_all('a') if a.has_attr('href') and 'rider/' in a['href']]
                # Filter out obvious non-riders if any
                riders_2025 = list(set([r for r in riders_2025 if 'rider/' in r]))
                print(f"Found {len(riders_2025)} unique rider links in 2025. First 5: {riders_2025[:5]}")
    else:
        print("Failed to fetch.")

if __name__ == "__main__":
    test_scraper()
