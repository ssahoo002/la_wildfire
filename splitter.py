import json
import os

def split_geojson(input_file, output_dir, max_size):
    """
    Splits a GeoJSON file into multiple smaller files, each not exceeding max_size in bytes.

    Args:
        input_file (str): Path to the input GeoJSON file.
        output_dir (str): Directory to save the split GeoJSON files.
        max_size (int): Maximum size of each output file in bytes.
    """
    # Load the GeoJSON file
    with open(input_file, 'r') as f:
        data = json.load(f)

    # Ensure the input is a FeatureCollection
    if data.get("type") != "FeatureCollection":
        raise ValueError("Input GeoJSON must be a FeatureCollection.")

    features = data["features"]
    os.makedirs(output_dir, exist_ok=True)

    part = 1
    current_features = []
    current_size = 0

    # This loops while the size of remaining features is greater than individual max file size
    for feature in features:
        feature_size = len(json.dumps(feature).encode('utf-8'))
        if current_size + feature_size > max_size and current_features:
            save_geojson(output_dir, part, current_features)
            part += 1
            current_features = []
            current_size = 0

        current_features.append(feature)
        current_size += feature_size

    # Writes leftovers
    if current_features:
        save_geojson(output_dir, part, current_features)

def save_geojson(output_dir, part, current_features):
    output_file = os.path.join(output_dir, f"{part}.geojso")
    with open(output_file, 'w') as out_f:
        json.dump({"type": "FeatureCollection", "features": current_features}, out_f)
    print(f"Written {output_file} with {len(current_features)} features.")

# Example usage
split_geojson("structure_data_filtered.geojson", "final/data_split", 26214400)  # Max size in bytes