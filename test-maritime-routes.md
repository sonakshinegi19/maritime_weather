# Maritime Routing System - Test Routes

## Predefined Maritime Corridors

The new maritime routing system uses predefined routes based on actual shipping lanes and maritime navigation practices.

### Available Predefined Routes:

1. **Mumbai to Chennai Route** (Indian Ocean)
   - Start: Mumbai Port (18.94°N, 72.83°E)
   - End: Chennai Port (13.08°N, 80.28°E)
   - Waypoints: Goa → Mangalore → Kochi → South India Coast → Tamil Nadu → Chennai
   - **NO LAND CROSSINGS** - Follows coastal waters

2. **Mumbai to Kolkata Route** (Indian Ocean)
   - Start: Mumbai Port (18.94°N, 72.83°E)
   - End: Kolkata Port (22.57°N, 88.36°E)
   - Waypoints: Goa → Mangalore → Kochi → Sri Lanka West → Sri Lanka East → Bay of Bengal → Andhra Coast → Odisha Coast → Kolkata
   - **NO LAND CROSSINGS** - Routes around Sri Lanka

3. **India to Singapore Route** (Indian Ocean)
   - Start: Chennai Port (13.08°N, 80.28°E)
   - End: Singapore Port (1.29°N, 103.85°E)
   - Waypoints: Bay of Bengal South → Sri Lanka Southeast → Nicobar Islands → Sumatra West → Malacca Strait → Singapore
   - **NO LAND CROSSINGS** - Uses Malacca Strait

4. **Mumbai to Dubai Route** (Arabian Sea)
   - Start: Mumbai Port (18.94°N, 72.83°E)
   - End: Dubai Port (25.27°N, 55.33°E)
   - Waypoints: Gujarat Coast → Pakistan Coast → Arabian Sea Central → Oman Coast → Dubai
   - **NO LAND CROSSINGS** - Pure maritime route

5. **Gibraltar to Suez Route** (Mediterranean)
   - Start: Strait of Gibraltar (36.0°N, 5.6°W)
   - End: Suez Canal (30.0°N, 32.3°E)
   - Waypoints: Algeria Coast → Central Mediterranean → Sicily Strait → Crete South → Egypt Coast → Suez
   - **NO LAND CROSSINGS** - Mediterranean shipping lane

6. **Europe to Americas Route** (Atlantic)
   - Start: English Channel (50.0°N, 1.0°E)
   - End: New York Port (40.7°N, 74.0°W)
   - Waypoints: Bay of Biscay → North Atlantic West → Mid Atlantic → North Atlantic Central → North America Approach → New York
   - **NO LAND CROSSINGS** - Trans-Atlantic route

7. **Asia to Americas Pacific Route** (Pacific)
   - Start: Tokyo Bay (35.0°N, 140.0°E)
   - End: Seattle Port (47.6°N, 122.3°W)
   - Waypoints: North Pacific West → North Pacific Central → North Pacific East → Pacific Northwest → Seattle
   - **NO LAND CROSSINGS** - Trans-Pacific route

## Key Features:

✅ **Real Maritime Routes**: Based on actual shipping lanes and navigation practices
✅ **No Land Crossings**: All routes strictly follow water paths
✅ **Strategic Waypoints**: Uses established maritime navigation points
✅ **Regional Optimization**: Specialized routes for different ocean regions
✅ **Fallback System**: Safe oceanic routing for non-predefined routes

## Testing Instructions:

1. Go to Route Planner
2. Try these test routes:
   - Mumbai (18.94, 72.83) to Chennai (13.08, 80.28)
   - Mumbai (18.94, 72.83) to Dubai (25.27, 55.33)
   - Any other combination from the predefined routes

The system will now generate proper maritime routes that avoid land completely!
