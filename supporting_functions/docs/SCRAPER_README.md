# Daggerheart Equipment Web Scraper

## Overview
This script scrapes equipment data from the Demiplane Daggerheart equipment database and formats it into JSON for LLM ingestion.

## Script: `scrape_daggerheart_equipment.py`

### Features
- **Direct URL navigation**: Collects all equipment URLs first, then visits each directly
- **Complete property extraction**: Parses all weapon/armor stats (Trait, Range, Damage, Burden, Tier, Features)
- **Automatic type detection**: Classifies items as armor, primary_weapon, secondary_weapon, consumable, or item
- **JSON formatting**: Outputs data matching your specified format for LLM ingestion

### Usage

```bash
python supporting_functions/scrape_daggerheart_equipment.py
```

The script will:
1. Load the Demiplane equipment page
2. Scroll to load all visible items
3. Collect equipment item URLs
4. Visit each URL and extract full details
5. Save to `equipment_data.json` in the project root

### Output Format

The script produces JSON matching your example format:

**Armor:**
```json
{
    "type": "armor",
    "name": "Advanced Chainmail Armor",
    "properties": {
        "Base_Score": 6,
        "Tier": 3,
        "Feature": {
            "Feature_Name": "Heavy",
            "Effect": "−1 to Evasion"
        }
    }
}
```

**Weapons:**
```json
{
    "type": "primary_weapon",
    "name": "Aantari Bow",
    "properties": {
        "Trait": "Finesse",
        "Range": "Far",
        "Damage": "d6+11 phy",
        "Burden": "Two-Handed",
        "Tier": 4,
        "Feature": {
            "Feature_Name": "Reliable",
            "Effect": "+1 to attack rolls"
        }
    }
}
```

**Consumables/Items:**
```json
{
    "type": "consumable",
    "name": "Acidpaste",
    "description": "This paste eats away walls and other surfaces in bright flashes."
}
```

### Current Limitations

1. **Page Pagination**: The script currently loads the first 20 visible items. If Demiplane uses pagination or "Load More" buttons, you may need to:
   - Increase scroll iterations in the `get_equipment_items()` function
   - Look for and click "Load More" buttons
   - Check if there are multiple pages to scrape

2. **Login Requirements**: Some equipment items may require a Demiplane account to access. The script runs without login, so it only gets publicly available items.

3. **Missing Properties**: Some items may not have all properties parsed (e.g., "Advanced Cutlass" was classified as "item" instead of weapon). You may need to manually review and fix edge cases.

### Dependencies

- `selenium` - Automatically installed on first run
- Chrome browser and ChromeDriver (must be installed separately)

### Installation of ChromeDriver

**Windows:**
1. Download from https://chromedriver.chromium.org/downloads
2. Match your Chrome version
3. Add to PATH or place in project directory

**Alternative:**
Use `webdriver-manager` for automatic driver management:
```bash
pip install webdriver-manager
```

Then modify the script to use:
```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
```

### Extending the Scraper

To get ALL equipment items (not just first 20):

1. **Check for pagination**: Inspect the page for pagination controls
2. **Increase scrolling**: Modify the loop in `get_equipment_items()`:
   ```python
   for _ in range(30):  # Increase from 12 to 30+
       driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
       time.sleep(2)  # Increase wait time
   ```
3. **Look for "Load More"**: Add code to click load more buttons:
   ```python
   while True:
       try:
           load_more = driver.find_element(By.XPATH, "//button[contains(text(), 'Load More')]")
           load_more.click()
           time.sleep(2)
       except:
           break
   ```

### Troubleshooting

**Issue**: Only 20 items scraped
- **Solution**: Increase scroll iterations or add "Load More" button clicking

**Issue**: Chrome driver not found
- **Solution**: Install ChromeDriver or use webdriver-manager

**Issue**: Empty properties
- **Solution**: Check if the item page loaded properly (increase wait times)

**Issue**: Stale element errors
- **Solution**: Script already handles this by navigating to URLs directly instead of clicking/back

### Output

- **Location**: `equipment_data.json` in project root
- **Format**: JSON array of equipment objects
- **Use**: Feed directly to Gemini LLM as part of your DM knowledge base

### Integration with MUD Game

This equipment data can be combined with the Daggerheart SRD to give your Gemini DM complete knowledge of:
- Available equipment
- Item stats and properties
- Equipment tiers and features

Load both files into Gemini's context for comprehensive game mastering!

