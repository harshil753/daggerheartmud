"""
Daggerheart Equipment Scraper for Demiplane
Extracts equipment data and formats it into JSON for LLM ingestion.
"""

import json
import time
import re
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
except ImportError:
    print("Installing selenium...")
    import os
    os.system("pip install selenium")
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options

URL = "https://app.demiplane.com/nexus/daggerheart/equipment"
OUTPUT_FILE = Path(__file__).parent.parent / "equipment_data.json"

def setup_driver():
    """Setup Chrome WebDriver."""
    print("Setting up Chrome...")
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)  # 30 second timeout for page loads
    driver.implicitly_wait(10)  # 10 second implicit wait
    return driver

def parse_item_properties(text):
    """Parse item properties from text."""
    props = {}
    
    # Armor properties
    if m := re.search(r'Major[:\s]+(\d+)', text, re.I):
        if m2 := re.search(r'Severe[:\s]+(\d+)', text, re.I):
            props["Base_Thresholds"] = {"Major": int(m.group(1)), "Severe": int(m2.group(1))}
    
    if m := re.search(r'(?:Armor\s+)?Score[:\s]+(\d+)', text, re.I):
        props["Base_Score"] = int(m.group(1))
    
    # Weapon properties
    if m := re.search(r'Trait[:\s]+(Finesse|Agility|Strength|Instinct)', text, re.I):
        props["Trait"] = m.group(1)
    
    if m := re.search(r'Range[:\s]+(Very Far|Far|Close|Melee)', text, re.I):
        props["Range"] = m.group(1)
    
    if m := re.search(r'Damage[:\s]+(d\d+[+\-]\d+\s+\w+)', text, re.I):
        props["Damage"] = m.group(1)
    
    if m := re.search(r'(One-Handed|Two-Handed)', text, re.I):
        props["Burden"] = m.group(1)
    
    # Tier
    if m := re.search(r'Tier[:\s]+(\d+)', text, re.I):
        props["Tier"] = int(m.group(1))
    
    # Features
    if "Reliable" in text:
        props["Feature"] = {"Feature_Name": "Reliable", "Effect": "+1 to attack rolls"}
    elif "Hooked" in text:
        props["Feature"] = {"Feature_Name": "Hooked", 
                           "Effect": "On a successful attack, you can pull the target into Melee range."}
    elif "Heavy" in text and "Evasion" in text:
        props["Feature"] = {"Feature_Name": "Heavy", "Effect": "−1 to Evasion"}
    elif "Light" in text and "Evasion" in text:
        props["Feature"] = {"Feature_Name": "Light", "Effect": "+1 to Evasion"}
    
    return props

def get_item_type(name, text):
    """Determine item type."""
    nl, tl = name.lower(), text.lower()
    
    if any(w in nl for w in ["armor", "chainmail", "plate", "gambeson"]):
        return "armor"
    if any(w in nl for w in ["paste", "potion", "elixir", "tonic"]):
        return "consumable"
    if "hand crossbow" in nl or ("grappler" in nl and "secondary" in tl):
        return "secondary_weapon"
    if any(w in nl for w in ["bow", "sword", "axe", "staff", "crossbow", "gauntlet", "ring", "wheelchair", "halberd", "spear", "hammer", "dagger"]):
        return "primary_weapon"
    return "item"

def get_equipment_items(driver):
    """Get list of equipment item names and URLs from all pages."""
    print(f"Loading main page: {URL}")
    driver.get(URL)
    time.sleep(4)
    
    all_items = {}
    page_num = 1
    next_button_xpath = "/html/body/div[1]/div/div/div/div[1]/div[2]/div/div/div/div/div[4]/div[2]/div[1]/div[5]/button"
    max_pages = 20  # Reasonable limit
    consecutive_empty_pages = 0
    
    while page_num <= max_pages:
        print(f"Processing page {page_num}...")
        
        # Scroll to load everything on current page
        print("  Scrolling to load all items...")
        for _ in range(6):  # Reduced scroll iterations
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1.5)
        
        # Collect equipment items from current page
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/equipment/']")
        page_items = 0
        
        skip_words = ["EQUIPMENT", "Equipment", "Search", "Filter", "Home", "Sign"]
        
        for link in links:
            try:
                href = link.get_attribute('href')
                text = link.text.strip()
                
                if not text or len(text) < 3:
                    continue
                
                first_line = text.split('\n')[0].strip()
                
                # Skip navigation items
                if any(skip in first_line for skip in skip_words):
                    continue
                
                # Only include if it's a direct equipment item link
                if '/equipment/' in href and href not in all_items.values():
                    all_items[first_line] = href
                    page_items += 1
            except:
                continue
        
        print(f"  Found {page_items} new items on page {page_num}")
        
        # Track consecutive empty pages
        if page_items == 0:
            consecutive_empty_pages += 1
            if consecutive_empty_pages >= 2:
                print(f"  No new items found for 2 consecutive pages. Stopping.")
                break
        else:
            consecutive_empty_pages = 0
        
        # Try to find and click next page button
        try:
            next_button = driver.find_element(By.XPATH, next_button_xpath)
            
            # Check if button is enabled/clickable
            if next_button.is_enabled() and next_button.is_displayed():
                print(f"  Clicking next page button...")
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_button)
                time.sleep(1)
                
                # Try clicking with JavaScript if regular click fails
                try:
                    next_button.click()
                except:
                    driver.execute_script("arguments[0].click();", next_button)
                
                time.sleep(2)  # Reduced wait time
                page_num += 1
            else:
                print(f"  Next button not available or disabled. Reached last page.")
                break
        except Exception as e:
            print(f"  Could not find next page button: {e}")
            print(f"  Reached last page at page {page_num}")
            break
    
    print(f"\nTotal found: {len(all_items)} equipment items across {page_num} pages\n")
    return all_items

def scrape():
    """Main scrape function."""
    print("=" * 70)
    print("DAGGERHEART EQUIPMENT SCRAPER")
    print("=" * 70 + "\n")
    
    driver = setup_driver()
    
    try:
        # Get all equipment items with their URLs
        items = get_equipment_items(driver)
        
        equipment_list = []
        
        for idx, (name, url) in enumerate(items.items(), 1):
            print(f"[{idx}/{len(items)}] {name}...", end=" ")
            
            try:
                # Navigate directly to the item page
                driver.get(url)
                time.sleep(2)
                
                # Get page text
                page_text = driver.find_element(By.TAG_NAME, "body").text
                props = parse_item_properties(page_text)
                item_type = get_item_type(name, page_text)
                
                # Build item data
                if item_type in ["armor", "primary_weapon", "secondary_weapon"]:
                    item_data = {"type": item_type, "name": name, "properties": props}
                else:
                    # Extract description
                    lines = [l.strip() for l in page_text.split('\n') if len(l.strip()) > 20]
                    desc = ' '.join([l for l in lines if not any(x in l for x in ['Tier', 'Equipment', 'Search', 'Daggerheart'])][:3])
                    item_data = {"type": item_type, "name": name, "description": desc[:400]}
                
                equipment_list.append(item_data)
                print(f"OK ({item_type}, {len(props)} props)")
                
            except Exception as e:
                print(f"ERROR: {str(e)[:50]}")
                continue
        
        return equipment_list
        
    except Exception as e:
        print(f"\nCritical error: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        print("\nClosing browser...")
        driver.quit()

def save_json(data, path):
    """Save to JSON."""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"Saved to: {path}")

def main():
    data = scrape()
    
    if data:
        save_json(data, OUTPUT_FILE)
        
        print("\n" + "=" * 70)
        print(f"COMPLETE: {len(data)} items extracted")
        print("=" * 70)
        
        counts = {}
        for item in data:
            t = item.get('type', 'unknown')
            counts[t] = counts.get(t, 0) + 1
        
        print("\nBreakdown by type:")
        for t, c in sorted(counts.items()):
            print(f"  {t}: {c}")
            
        print(f"\nJSON output: {OUTPUT_FILE}")
        print("Ready for LLM ingestion!")
    else:
        print("\nNo data extracted.")
        print("Note: This website may require login to access full equipment data.")

if __name__ == "__main__":
    main()
