import math

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine formula — returns straight-line distance in km between two lat/lng points
    """
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def road_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Road-corrected distance (straight-line × 1.3 factor)
    """
    return haversine_km(lat1, lon1, lat2, lon2) * 1.3

def travel_time_minutes(distance_km: float, avg_speed_kmh: float = 60.0) -> float:
    """
    Estimated travel time in minutes given road distance and average speed
    """
    if avg_speed_kmh <= 0:
        avg_speed_kmh = 60.0
    return (distance_km / avg_speed_kmh) * 60.0
