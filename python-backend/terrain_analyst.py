#!/usr/bin/env python3
"""
TERRAIN ANALYST — Coordinate-driven LiDAR & forensic terrain research tool
============================================================
Input: GPS coordinates
Output: LiDAR data fetch, terrain profile, anomaly detection, GPR protocol, research report

Dependencies:
    pip install requests pandas numpy matplotlib scipy folium
"""

import argparse
import json
import os
import sys
import time
import math
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.colors as mcolors
    from matplotlib.patches import Ellipse
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False

try:
    import folium
    HAS_FOLIUM = True
except ImportError:
    HAS_FOLIUM = False

try:
    from scipy.ndimage import gaussian_filter
    from scipy.signal import find_peaks
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


# ============================================================
# CONFIG
# ============================================================

OPENTOPODATA_URL = "https://api.opentopodata.org/v1/srtm30m"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


# ============================================================
# UTILITIES
# ============================================================

def offset_coords(lat, lon, dx_m, dy_m):
    """Offset lat/lon by dx/dy meters."""
    lat2 = lat + (dy_m / 111320)
    lon2 = lon + (dx_m / (111320 * math.cos(math.radians(lat))))
    return round(lat2, 6), round(lon2, 6)


def haversine(lat1, lon1, lat2, lon2):
    """Distance in meters between two coords."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def meters_to_deg(meters, lat):
    lat_deg = meters / 111320
    lon_deg = meters / (111320 * math.cos(math.radians(lat)))
    return lat_deg, lon_deg


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")


# ============================================================
# MODULE 1: ELEVATION DATA (OpenTopoData / SRTM30m)
# ============================================================

def fetch_elevation_grid(center_lat, center_lon, radius_m=500, grid_spacing_m=50):
    """
    Build a grid of elevation points around center coordinate.
    Uses OpenTopoData (free, no key required) backed by SRTM30m.
    """
    log(f"Fetching elevation grid ({radius_m}m radius, {grid_spacing_m}m spacing)...")

    steps = int(radius_m / grid_spacing_m)
    points = []
    for dy in range(-steps, steps+1):
        for dx in range(-steps, steps+1):
            lat, lon = offset_coords(center_lat, center_lon,
                                     dx * grid_spacing_m, dy * grid_spacing_m)
            points.append((lat, lon))

    # OpenTopoData accepts max 100 points per request
    results = []
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        locations = "|".join(f"{lat},{lon}" for lat, lon in batch)
        try:
            r = requests.get(
                f"{OPENTOPODATA_URL}?locations={locations}",
                timeout=30
            )
            r.raise_for_status()
            data = r.json()
            for j, result in enumerate(data.get('results', [])):
                lat, lon = batch[j]
                elev = result.get('elevation')
                results.append({'lat': lat, 'lon': lon, 'elevation': elev})
            time.sleep(0.5)  # rate limit courtesy
        except Exception as e:
            log(f"Elevation batch {i//batch_size + 1} failed: {e}", "WARN")
            for lat, lon in batch:
                results.append({'lat': lat, 'lon': lon, 'elevation': None})

    df = pd.DataFrame(results)
    fetched = df['elevation'].notna().sum()
    log(f"Elevation grid: {len(df)} points, {fetched} with valid data", "OK")
    return df


# ============================================================
# MODULE 2: TERRAIN ANALYSIS
# ============================================================

def analyze_terrain(elev_df, center_lat, center_lon):
    """
    Compute slope, aspect, curvature, and drainage vectors.
    Identify anomaly candidates (depressions, sinkholes, undercuts).
    """
    log("Running terrain analysis...")

    df = elev_df.dropna(subset=['elevation']).copy()
    if len(df) < 9:
        log("Insufficient elevation data for terrain analysis", "WARN")
        return df, {}, pd.DataFrame()

    # Add distance from center
    df['dist_m'] = df.apply(
        lambda r: haversine(center_lat, center_lon, r['lat'], r['lon']), axis=1
    )

    # Pivot to grid for gradient calculations
    lats = sorted(df['lat'].unique())
    lons = sorted(df['lon'].unique())

    if len(lats) < 3 or len(lons) < 3:
        log("Grid too small for gradient analysis", "WARN")
        return df, {}, pd.DataFrame()

    # Build elevation matrix
    elev_matrix = np.full((len(lats), len(lons)), np.nan)
    lat_idx = {v: i for i, v in enumerate(lats)}
    lon_idx = {v: i for i, v in enumerate(lons)}

    for _, row in df.iterrows():
        if row['lat'] in lat_idx and row['lon'] in lon_idx:
            elev_matrix[lat_idx[row['lat']], lon_idx[row['lon']]] = row['elevation']

    # Smooth for gradient calculation
    if HAS_SCIPY and not np.all(np.isnan(elev_matrix)):
        valid_mask = ~np.isnan(elev_matrix)
        smooth = np.where(valid_mask, elev_matrix, 0)
        smooth = gaussian_filter(smooth, sigma=1)
        smooth = np.where(valid_mask, smooth, np.nan)
    else:
        smooth = elev_matrix.copy()

    # Compute gradients (slope in degrees)
    if not np.all(np.isnan(smooth)):
        dy, dx = np.gradient(np.nan_to_num(smooth))
        spacing_m = 50
        slope_deg = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2) / spacing_m))
        aspect_deg = np.degrees(np.arctan2(-dx, dy)) % 360
    else:
        slope_deg = np.zeros_like(smooth)
        aspect_deg = np.zeros_like(smooth)

    # Anomaly detection: local depressions (center lower than neighbors)
    anomalies = []
    for i in range(1, len(lats)-1):
        for j in range(1, len(lons)-1):
            center_e = elev_matrix[i, j]
            if np.isnan(center_e):
                continue
            neighbors = [
                elev_matrix[i-1, j], elev_matrix[i+1, j],
                elev_matrix[i, j-1], elev_matrix[i, j+1],
                elev_matrix[i-1, j-1], elev_matrix[i+1, j+1],
                elev_matrix[i-1, j+1], elev_matrix[i+1, j-1],
            ]
            valid_neighbors = [n for n in neighbors if not np.isnan(n)]
            if len(valid_neighbors) < 4:
                continue
            mean_neighbor = np.mean(valid_neighbors)
            depression_depth = mean_neighbor - center_e

            # Phase classification
            if depression_depth > 2.0:
                phase = 3
                confidence = "HIGH"
            elif depression_depth > 0.8:
                phase = 2
                confidence = "MEDIUM"
            elif depression_depth > 0.3:
                phase = 1
                confidence = "LOW"
            else:
                continue

            slope = slope_deg[i, j]
            anomalies.append({
                'lat': float(lats[i]),
                'lon': float(lons[j]),
                'elevation': float(center_e),
                'depression_depth_m': round(float(depression_depth), 2),
                'slope_deg': round(float(slope), 1),
                'aspect_deg': round(float(aspect_deg[i, j]), 1),
                'phase': int(phase),
                'confidence': confidence,
                'dist_from_center_m': round(float(haversine(
                    center_lat, center_lon, lats[i], lons[j])), 1)
            })

    anomalies_df = pd.DataFrame(anomalies).sort_values(
        'depression_depth_m', ascending=False
    ) if anomalies else pd.DataFrame()

    stats = {
        'center_elevation': float(df[df['dist_m'] < 60]['elevation'].mean())
                             if len(df[df['dist_m'] < 60]) > 0 else None,
        'min_elevation': float(df['elevation'].min()),
        'max_elevation': float(df['elevation'].max()),
        'elevation_range': float(df['elevation'].max() - df['elevation'].min()),
        'mean_slope_deg': float(slope_deg[~np.isnan(elev_matrix)].mean())
                          if not np.all(np.isnan(elev_matrix)) else 0,
        'anomaly_count': len(anomalies_df),
        'phase3_count': int(len(anomalies_df[anomalies_df['phase'] == 3]))
                        if not anomalies_df.empty else 0,
    }

    log(f"Terrain analysis complete: {len(anomalies_df)} anomalies detected "
        f"({stats['phase3_count']} Phase 3)", "OK")

    return df, stats, anomalies_df


# ============================================================
# MODULE 3: OVERPASS / OSM FEATURE FETCH
# ============================================================

def fetch_nearby_features(center_lat, center_lon, radius_m=600):
    """
    Query OpenStreetMap Overpass API for waterways, roads, buildings, land use.
    """
    log("Fetching nearby terrain features (OSM Overpass)...")

    lat_d, lon_d = meters_to_deg(radius_m, center_lat)

    query = f"""
    [out:json][timeout:25];
    (
      way["waterway"~"stream|river|ditch|drain"]
         ({center_lat-lat_d},{center_lon-lon_d},
          {center_lat+lat_d},{center_lon+lon_d});
      way["highway"]
         ({center_lat-lat_d},{center_lon-lon_d},
          {center_lat+lat_d},{center_lon+lon_d});
      way["landuse"~"forest|wood|residential"]
         ({center_lat-lat_d},{center_lon-lon_d},
          {center_lat+lat_d},{center_lon+lon_d});
      way["natural"~"wood|water|wetland|valley"]
         ({center_lat-lat_d},{center_lon-lon_d},
          {center_lat+lat_d},{center_lon+lon_d});
    );
    out body; >; out skel qt;
    """

    try:
        r = requests.post(OVERPASS_URL, data=query, timeout=30)
        r.raise_for_status()
        data = r.json()
        elements = data.get('elements', [])
        features = {'waterways': [], 'roads': [], 'forest': [], 'buildings': []}

        for el in elements:
            tags = el.get('tags', {})
            if 'waterway' in tags:
                features['waterways'].append({
                    'type': tags.get('waterway'),
                    'name': tags.get('name', 'unnamed'),
                    'id': el.get('id')
                })
            elif 'highway' in tags:
                features['roads'].append({
                    'type': tags.get('highway'),
                    'name': tags.get('name', 'unnamed'),
                    'id': el.get('id')
                })
            elif tags.get('landuse') in ('forest', 'wood') or tags.get('natural') in ('wood',):
                features['forest'].append({'id': el.get('id')})

        log(f"OSM features: {len(features['waterways'])} waterways, "
            f"{len(features['roads'])} roads, {len(features['forest'])} forest areas", "OK")
        return features

    except Exception as e:
        log(f"Overpass fetch failed: {e}", "WARN")
        return {'waterways': [], 'roads': [], 'forest': [], 'buildings': []}


# ============================================================
# MODULE 4: GPR PROTOCOL GENERATOR
# ============================================================

def generate_gpr_protocol(center_lat, center_lon, anomalies_df, features, temp_c=-18):
    """
    Generate site-specific GPR scan protocol based on anomaly locations,
    soil/snow conditions, temperature, and terrain type.
    """
    log("Generating GPR protocol...")

    has_waterway = len(features.get('waterways', [])) > 0

    # Antenna frequency recommendation
    if temp_c <= -15:
        antenna_mhz = "400-500 MHz (bistatic)"
        dielectric = 3.5
        time_window_ns = "60-80 ns"
        depth_note = "Frozen soil — good GPR medium, low attenuation"
    elif temp_c <= -5:
        antenna_mhz = "500-900 MHz"
        dielectric = 5.0
        time_window_ns = "40-60 ns"
        depth_note = "Mixed frozen/thaw — moderate attenuation"
    else:
        antenna_mhz = "250-500 MHz"
        dielectric = 8.0
        time_window_ns = "80-100 ns"
        depth_note = "Saturated soil — high attenuation, reduce scan speed"

    scan_pattern = "Star (spoke) pattern" if not anomalies_df.empty else "Grid 0.5m transects"
    waterway_note = (
        "SIDE-SADDLE scan along creek banks — aim antenna toward creek axis "
        "to detect sub-nivean void spaces under undercut banks."
        if has_waterway else "No waterways flagged in immediate radius."
    )

    protocol = {
        'antenna_freq': antenna_mhz,
        'dielectric_constant': float(dielectric),
        'time_window_ns': time_window_ns,
        'scan_pattern': scan_pattern,
        'transect_spacing_m': 0.5,
        'depth_note': depth_note,
        'waterway_note': waterway_note,
        'calibration': (
            "Hyperbola fitting on known buried rock/root to lock velocity. "
            "Do NOT use default 'average soil' preset — will produce incorrect depth readings."
        ),
        'signal_target': (
            "Hyperbolic diffraction curves breaking natural horizontal stratigraphy. "
            "'Clutter cluster' 1-3m depth inconsistent with surrounding root/rock pattern."
        ),
        'sites': []
    }

    if not anomalies_df.empty:
        for _, row in anomalies_df.head(12).iterrows():
            site = {
                'lat': float(row['lat']),
                'lon': float(row['lon']),
                'phase': int(row['phase']),
                'depression_depth_m': float(row['depression_depth_m']),
                'confidence': row['confidence'],
                'dist_from_center_m': float(row['dist_from_center_m']),
                'spoke_transects': 6 if row['phase'] >= 2 else 4,
                'priority': 'CRITICAL' if row['phase'] == 3 else
                            'HIGH' if row['phase'] == 2 else 'STANDARD',
            }
            protocol['sites'].append(site)

    log(f"GPR protocol generated: {len(protocol['sites'])} priority sites", "OK")
    return protocol


# ============================================================
# MODULE 5: MAP OUTPUT (Folium)
# ============================================================

def generate_map_html(center_lat, center_lon, elev_df, anomalies_df, features,
                      gpr_protocol):
    """Generate interactive HTML map string with all layers."""
    if not HAS_FOLIUM:
        log("folium not installed — skipping map generation", "WARN")
        return None

    log("Generating interactive map...")

    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=16,
        tiles=None
    )

    folium.TileLayer('OpenStreetMap', name='OpenStreetMap').add_to(m)
    folium.TileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri', name='Satellite', overlay=False
    ).add_to(m)

    # Center pin
    folium.Marker(
        [center_lat, center_lon],
        popup=f"Search Center<br>{center_lat}N {abs(center_lon)}W",
        icon=folium.Icon(color='red', icon='crosshairs', prefix='fa')
    ).add_to(m)

    # Search radius
    folium.Circle(
        [center_lat, center_lon],
        radius=500,
        color='#ff4400',
        fill=False,
        weight=1.5,
        dash_array='8 4',
        popup='500m search radius'
    ).add_to(m)

    # Anomaly markers
    if not anomalies_df.empty:
        anomaly_group = folium.FeatureGroup(name='Anomaly targets', show=True)
        colors = {3: '#ffe000', 2: '#ff8800', 1: '#88aaff'}
        for _, row in anomalies_df.iterrows():
            color = colors.get(int(row['phase']), '#888888')
            folium.CircleMarker(
                [row['lat'], row['lon']],
                radius=8 if row['phase'] == 3 else 6,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.8,
                popup=folium.Popup(
                    f"<b>Phase {int(row['phase'])} Anomaly</b><br>"
                    f"Depression: {row['depression_depth_m']}m<br>"
                    f"Confidence: {row['confidence']}<br>"
                    f"Slope: {row['slope_deg']}deg<br>"
                    f"Dist from center: {row['dist_from_center_m']}m<br>"
                    f"GPR priority: {'CRITICAL' if row['phase']==3 else 'HIGH'}",
                    max_width=200
                )
            ).add_to(anomaly_group)
        anomaly_group.add_to(m)

    # GPR star transect lines
    gpr_group = folium.FeatureGroup(name='GPR transect lines', show=True)
    for site in gpr_protocol.get('sites', []):
        spokes = site.get('spoke_transects', 6)
        for i in range(spokes):
            angle = (360 / spokes) * i
            end_lat, end_lon = offset_coords(
                site['lat'], site['lon'],
                20 * math.sin(math.radians(angle)),
                20 * math.cos(math.radians(angle))
            )
            folium.PolyLine(
                [[site['lat'], site['lon']], [end_lat, end_lon]],
                color='#00ffaa',
                weight=1,
                opacity=0.6
            ).add_to(gpr_group)
    gpr_group.add_to(m)

    folium.LayerControl().add_to(m)

    return m._repr_html_()


# ============================================================
# MODULE 6: ELEVATION PROFILE PLOT (returns base64 PNG)
# ============================================================

def generate_terrain_plot_base64(elev_df, anomalies_df, center_lat, center_lon, stats):
    """Generate terrain elevation heatmap and profile plots, return base64 PNG."""
    if not HAS_MATPLOTLIB:
        log("matplotlib not installed — skipping plots", "WARN")
        return None

    log("Generating terrain plots...")
    import io, base64

    fig, axes = plt.subplots(1, 2, figsize=(14, 6), facecolor='#050d14')

    ax1 = axes[0]
    ax1.set_facecolor('#050d14')

    df_clean = elev_df.dropna(subset=['elevation'])
    if not df_clean.empty:
        sc = ax1.scatter(
            df_clean['lon'], df_clean['lat'],
            c=df_clean['elevation'],
            cmap='terrain',
            s=15, alpha=0.8, zorder=2
        )
        plt.colorbar(sc, ax=ax1, label='Elevation (m)', shrink=0.8)

    if not anomalies_df.empty:
        colors_p = {3: '#ffe000', 2: '#ff8800', 1: '#88aaff'}
        for phase in [1, 2, 3]:
            p_df = anomalies_df[anomalies_df['phase'] == phase]
            if not p_df.empty:
                ax1.scatter(p_df['lon'], p_df['lat'],
                           c=colors_p[phase], s=60, zorder=5,
                           label=f'Phase {phase}',
                           edgecolors='white', linewidths=0.5)

    ax1.scatter([center_lon], [center_lat], c='red', s=100,
               marker='+', zorder=6, linewidths=2, label='Center')
    ax1.set_title('Elevation Map + Anomalies', color='white', fontsize=11,
                  fontfamily='monospace')
    ax1.tick_params(colors='#4af')
    ax1.spines[:].set_color('#0e3a52')
    ax1.legend(fontsize=8, facecolor='#0a1a26', labelcolor='white')
    for label in ax1.get_xticklabels() + ax1.get_yticklabels():
        label.set_color('#4af')

    ax2 = axes[1]
    ax2.set_facecolor('#050d14')

    lon_tol = 0.001
    transect = df_clean[abs(df_clean['lon'] - center_lon) < lon_tol].sort_values('lat')

    if not transect.empty:
        dist = [haversine(transect.iloc[0]['lat'], center_lon, r['lat'], center_lon)
                for _, r in transect.iterrows()]
        ax2.fill_between(dist, transect['elevation'],
                        transect['elevation'].min() - 5,
                        alpha=0.3, color='#2a8a40')
        ax2.plot(dist, transect['elevation'], color='#4af', linewidth=1.5)

        if not anomalies_df.empty:
            for _, row in anomalies_df[anomalies_df['phase'] >= 2].iterrows():
                d = haversine(transect.iloc[0]['lat'], center_lon,
                             row['lat'], center_lon)
                if 0 < d < max(dist):
                    ax2.axvline(d, color='#ffe000', linewidth=0.8,
                               alpha=0.6, linestyle='--')
                    ax2.annotate(f"P{int(row['phase'])}",
                                xy=(d, row['elevation']),
                                fontsize=7, color='#ffe000',
                                fontfamily='monospace')

    ax2.set_xlabel('Distance N-S (m)', color='#4af', fontfamily='monospace')
    ax2.set_ylabel('Elevation (m)', color='#4af', fontfamily='monospace')
    ax2.set_title('N-S Elevation Profile', color='white', fontsize=11,
                  fontfamily='monospace')
    ax2.tick_params(colors='#4af')
    ax2.spines[:].set_color('#0e3a52')
    for label in ax2.get_xticklabels() + ax2.get_yticklabels():
        label.set_color('#4af')

    plt.suptitle(f'TERRAIN ANALYST // {center_lat}N {abs(center_lon)}W',
                color='white', fontsize=13, fontfamily='monospace', y=1.01)
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#050d14')
    plt.close()
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode('utf-8')
    log("Terrain plot generated (base64)", "OK")
    return b64


# ============================================================
# MODULE 7: REPORT GENERATOR (returns dict)
# ============================================================

def generate_report_data(center_lat, center_lon, stats, anomalies_df,
                         gpr_protocol, features):
    """Generate structured report data as dict."""
    log("Generating report...")

    report = {
        'metadata': {
            'generated': datetime.now().isoformat(),
            'tool': 'TERRAIN ANALYST v1.0',
            'center': {'lat': center_lat, 'lon': center_lon},
        },
        'terrain_stats': stats if isinstance(stats, dict) else {},
        'anomalies': anomalies_df.to_dict('records') if not anomalies_df.empty else [],
        'osm_features': features,
        'gpr_protocol': gpr_protocol,
    }

    log("Report generated", "OK")
    return report


# ============================================================
# MAIN PIPELINE (returns all results as dict)
# ============================================================

def run_analysis(lat, lon, radius_m=500, temp_c=-18):
    """Full pipeline: coords in -> complete terrain analysis out (as dict)."""

    log("=" * 55, "HEAD")
    log(f"  TERRAIN ANALYST — {lat}N {lon}W", "HEAD")
    log(f"  Radius: {radius_m}m | Temp: {temp_c}C", "HEAD")
    log("=" * 55, "HEAD")

    # 1. Elevation grid
    elev_df = fetch_elevation_grid(lat, lon, radius_m=radius_m, grid_spacing_m=50)

    # 2. Terrain analysis
    df, stats, anomalies_df = analyze_terrain(elev_df, lat, lon)

    # 3. OSM features
    features = fetch_nearby_features(lat, lon, radius_m=radius_m)

    # 4. GPR protocol
    gpr_protocol = generate_gpr_protocol(lat, lon, anomalies_df, features, temp_c)

    # 5. Map HTML
    map_html = generate_map_html(lat, lon, elev_df, anomalies_df, features, gpr_protocol)

    # 6. Plot (base64 PNG)
    plot_b64 = generate_terrain_plot_base64(elev_df, anomalies_df, lat, lon, stats)

    # 7. Report data
    report = generate_report_data(lat, lon, stats, anomalies_df, gpr_protocol, features)

    # Summary
    log("=" * 55, "OK")
    log("  ANALYSIS COMPLETE", "OK")
    log(f"  Anomalies found: {len(anomalies_df)}", "OK")
    if not anomalies_df.empty:
        log(f"  Phase 3 (critical): {len(anomalies_df[anomalies_df['phase']==3])}", "OK")
        log(f"  Phase 2 (high):     {len(anomalies_df[anomalies_df['phase']==2])}", "OK")
    log("=" * 55, "OK")

    return {
        'terrain_stats': stats,
        'anomalies': anomalies_df.to_dict('records') if not anomalies_df.empty else [],
        'osm_features': features,
        'gpr_protocol': gpr_protocol,
        'map_html': map_html,
        'terrain_plot_b64': plot_b64,
        'report': report,
        'elevation_grid': elev_df.to_dict('records'),
    }
