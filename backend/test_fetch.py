import httpx
import json

async def test_fetch():
    headers = {"User-Agent": "EV-Agent-Verse/1.0 (contact@evagent.org)"}
    
    # Test 1: OpenStreetMap Overpass GET
    osm_query = '[out:json][timeout:15];node["amenity"="charging_station"](around:50000, 11.0168, 76.9558);out body 15;'
    url = f"https://overpass-api.de/api/interpreter?data={osm_query}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url, headers=headers)
            print("OSM Overpass GET Status:", res.status_code)
            if res.status_code == 200:
                elements = res.json().get("elements", [])
                print("OSM Stations Found:", len(elements))
                for el in elements[:3]:
                    tags = el.get("tags", {})
                    print(" -", tags.get("name") or tags.get("operator") or f"OSM EV Charger #{el.get('id')}", f"({el.get('lat')}, {el.get('lon')})")
        except Exception as e:
            print("OSM error:", e)

    # Test 2: Nominatim search for EV charging station
    nom_url = "https://nominatim.openstreetmap.org/search"
    nom_params = {
        "q": "EV charging station near Coimbatore",
        "format": "json",
        "limit": 10
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(nom_url, params=nom_params, headers=headers)
            print("\nNominatim EV Search Status:", res.status_code)
            if res.status_code == 200:
                items = res.json()
                print("Nominatim Stations Found:", len(items))
                for item in items[:3]:
                    print(" -", item.get("display_name"), f"({item.get('lat')}, {item.get('lon')})")
        except Exception as e:
            print("Nominatim error:", e)

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_fetch())
