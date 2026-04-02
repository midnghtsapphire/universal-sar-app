#!/usr/bin/env python3
"""
Flask API server wrapping the Terrain Analyst pipeline.
All endpoints return real data from OpenTopoData, Overpass API, etc.
No demo data. No mocks.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from terrain_analyst import (
    run_analysis,
    fetch_elevation_grid,
    analyze_terrain,
    fetch_nearby_features,
    generate_gpr_protocol,
    generate_map_html,
    generate_terrain_plot_base64,
    generate_report_data,
    log,
)
import pandas as pd
import traceback

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'terrain-analyst-api', 'version': '1.0'})


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Full terrain analysis pipeline.
    Input JSON: { lat, lon, radius_m?, temp_c? }
    Returns: terrain_stats, anomalies, osm_features, gpr_protocol, map_html, terrain_plot_b64, report
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius_m = int(data.get('radius_m', 500))
        temp_c = float(data.get('temp_c', -18))

        log(f"API /api/analyze called: lat={lat}, lon={lon}, radius={radius_m}m, temp={temp_c}C")

        result = run_analysis(lat, lon, radius_m=radius_m, temp_c=temp_c)

        # Remove elevation_grid from response to keep payload manageable
        # (it can be 400+ points)
        elevation_summary = {
            'total_points': len(result.get('elevation_grid', [])),
            'sample': result.get('elevation_grid', [])[:10],
        }
        result['elevation_summary'] = elevation_summary
        del result['elevation_grid']

        return jsonify(result)

    except KeyError as e:
        return jsonify({'error': f'Missing required field: {e}'}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


@app.route('/api/elevation', methods=['POST'])
def elevation():
    """
    Module 1 only: Fetch elevation grid.
    Input JSON: { lat, lon, radius_m?, grid_spacing_m? }
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius_m = int(data.get('radius_m', 500))
        grid_spacing_m = int(data.get('grid_spacing_m', 50))

        df = fetch_elevation_grid(lat, lon, radius_m=radius_m, grid_spacing_m=grid_spacing_m)
        records = df.to_dict('records')

        return jsonify({
            'total_points': len(records),
            'valid_points': sum(1 for r in records if r.get('elevation') is not None),
            'data': records,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/features', methods=['POST'])
def features():
    """
    Module 3 only: Fetch OSM features.
    Input JSON: { lat, lon, radius_m? }
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius_m = int(data.get('radius_m', 600))

        result = fetch_nearby_features(lat, lon, radius_m=radius_m)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/gpr-protocol', methods=['POST'])
def gpr_protocol():
    """
    Module 4 only: Generate GPR protocol.
    Input JSON: { lat, lon, temp_c?, anomalies?, features? }
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        temp_c = float(data.get('temp_c', -18))

        anomalies_raw = data.get('anomalies', [])
        anomalies_df = pd.DataFrame(anomalies_raw) if anomalies_raw else pd.DataFrame()

        feat = data.get('features', {'waterways': [], 'roads': [], 'forest': [], 'buildings': []})

        protocol = generate_gpr_protocol(lat, lon, anomalies_df, feat, temp_c)
        return jsonify(protocol)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/terrain-analysis', methods=['POST'])
def terrain_analysis():
    """
    Module 2 only: Run terrain analysis on elevation data.
    Input JSON: { lat, lon, radius_m? }
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius_m = int(data.get('radius_m', 500))

        elev_df = fetch_elevation_grid(lat, lon, radius_m=radius_m, grid_spacing_m=50)
        df, stats, anomalies_df = analyze_terrain(elev_df, lat, lon)

        return jsonify({
            'stats': stats,
            'anomalies': anomalies_df.to_dict('records') if not anomalies_df.empty else [],
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/map', methods=['POST'])
def generate_map():
    """
    Generate interactive Folium map HTML.
    Input JSON: { lat, lon, radius_m?, temp_c? }
    """
    try:
        data = request.get_json(force=True)
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius_m = int(data.get('radius_m', 500))
        temp_c = float(data.get('temp_c', -18))

        elev_df = fetch_elevation_grid(lat, lon, radius_m=radius_m, grid_spacing_m=50)
        df, stats, anomalies_df = analyze_terrain(elev_df, lat, lon)
        features = fetch_nearby_features(lat, lon, radius_m=radius_m)
        gpr = generate_gpr_protocol(lat, lon, anomalies_df, features, temp_c)
        map_html = generate_map_html(lat, lon, elev_df, anomalies_df, features, gpr)

        return jsonify({'map_html': map_html})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 55)
    print("  TERRAIN ANALYST API SERVER")
    print("  Port: 5001 | All endpoints return REAL data")
    print("  No demo data. No mocks.")
    print("=" * 55)
    app.run(host='0.0.0.0', port=5001, debug=False)
