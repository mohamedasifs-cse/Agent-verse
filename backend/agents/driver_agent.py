from typing import Dict, Any
from utils.groq_client import call_groq, parse_groq_json

async def driver_agent(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    DRIVER BEHAVIOR & SAFETY AGENT
    Continuously monitors driving duration, speed, battery temperature, weather, and traffic conditions.
    Issues proactive safety warnings (rest breaks, speed reduction, thermal cooling, rain traction).
    """
    speed = telemetry.get("speedKmh", 0)
    v_type = telemetry.get("vehicleType", "car")
    is_driving = telemetry.get("mode") == "driving"
    ride_minutes = telemetry.get("continuousRideMinutes", 0)
    temp = telemetry.get("temperatureC", 25)
    is_rain = telemetry.get("rainActive", False)
    total_dist = telemetry.get("traveledKm", 0) or telemetry.get("totalDistanceKm", 0)

    if is_driving:
        high_threshold = 55 if v_type == "bike" else 95
        eco_score = 94
        if speed > high_threshold:
            eco_score -= 15
        if temp > 38:
            eco_score -= 12
        if ride_minutes > 45:
            eco_score -= 10
        if is_rain and speed > 40:
            eco_score -= 10
        eco_score = max(55, eco_score)
    else:
        eco_score = 98

    regen_recovered_kwh = round(total_dist * (0.01 if v_type == "bike" else 0.04), 1)

    coaching_tips = []
    if v_type == "bike":
        coaching_tips.append("🪖 Always wear an ISI certified helmet and secure chin strap.")

    if ride_minutes > 30 or total_dist > 45:
        coaching_tips.append(f"☕ Rest Break Tip: Continuous ride of {int(ride_minutes or 45)} mins detected. Take a 15-minute break to prevent fatigue.")

    if speed > (55 if v_type == "bike" else 95):
        coaching_tips.append(f"🚨 Speed Alert: Cruising at {int(speed)} km/h. Reduce speed below {55 if v_type == 'bike' else 85} km/h for battery efficiency.")

    if temp > 38:
        coaching_tips.append(f"🔥 Battery Thermal Tip: Pack temp at {temp}°C. Pause ride or reduce throttle to allow liquid/air cooling.")

    if is_rain:
        coaching_tips.append("🌧️ Rain Safety: Wet roads detected. Reduce speed by 20% and use progressive braking.")

    if not coaching_tips or len(coaching_tips) < 3:
        coaching_tips.append("🔋 Energy Tip: Maintain steady speed to optimize kWh discharge and extend total range.")

    driving_style = (
        "High Thermal Stress - Cooling Needed" if temp > 40 else
        "High-Speed Sprint / Overspeeding" if speed > (55 if v_type == "bike" else 95) else
        "Long-Distance Continuous Ride" if ride_minutes > 45 else
        "Wet Road / Rain Mode Active" if is_rain else
        ("Eco-Smooth Scooter Ride" if v_type == "bike" else "Eco-Smooth Highway Drive")
    )

    fallback = {
        "eco_score": eco_score,
        "driving_style": driving_style,
        "regen_recovered_kwh": regen_recovered_kwh,
        "safety_rating": "A+" if eco_score >= 90 else "A" if eco_score >= 80 else "B",
        "coaching_tip": coaching_tips[0],
        "coaching_tips": coaching_tips[:3],
        "confidence_score": 0.96,
    }

    system_prompt = f"""You are the Driver Behavior & Safety Agent for an EV ({v_type.upper()}).
Analyze real-time metrics: speed={speed} km/h, distance={total_dist} km, temp={temp}°C, rideMinutes={ride_minutes}, rain={is_rain}, vehicleType={v_type}.
Evaluate continuous driving duration, speed limit compliance, battery thermal safety, weather conditions, and traffic hazards.
Return JSON:
{{
  "eco_score": number (0-100),
  "driving_style": string,
  "regen_recovered_kwh": number,
  "safety_rating": string,
  "coaching_tip": string,
  "coaching_tips": [string],
  "confidence_score": number (0-1)
}}"""

    try:
        content = await call_groq([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Vehicle: {v_type}, speed={speed}km/h, dist={total_dist}km, temp={temp}C, duration={ride_minutes}m, rain={is_rain}"}
        ], model="llama-3.3-70b-versatile", options={"json_mode": True, "max_tokens": 400})

        return {**fallback, **parse_groq_json(content, fallback)}
    except Exception as err:
        print(f"[DriverAgent] Groq call failed, using rule-based fallback: {err}")
        return fallback

