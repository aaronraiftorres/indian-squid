from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
import folium
from folium.plugins import HeatMap
import matplotlib
matplotlib.use('Agg')  # For backend rendering
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
# Configure CORS to allow requests from your Vercel frontend
CORS(app, resources={
    r"/predict": {
        "origins": ["https://indian-squid.vercel.app", "http://localhost:3000"],
        "methods": ["OPTIONS", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
# Add this after_request handler for additional CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://indian-squid.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response

# Paths
base_path = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(base_path, 'locus.csv')
model_path = os.path.join(base_path, 'LOWYES.h5')
metadata_path = os.path.join(base_path, 'hotspot_metadata.csv')

# Load dataset
dataset = pd.read_csv(dataset_path)

# Data preprocessing
latitude_min, latitude_max = 11, 12
longitude_min, longitude_max = 123, 124
filtered_data = dataset[(dataset['latitude'] >= latitude_min) & (dataset['latitude'] <= latitude_max) &
                       (dataset['longitude'] >= longitude_min) & (dataset['longitude'] <= longitude_max)]

dataset.columns = dataset.columns.str.strip()  # Remove extra spaces

# Convert to numeric and handle missing values
for col in ['squid_abundance_per_kgs', 'ssh', 'sst', 'chl']:
    dataset[col] = pd.to_numeric(dataset[col], errors='coerce')

# Update interpolation method as per previous warnings
dataset = dataset.infer_objects(copy=False)
dataset = dataset.interpolate(method='linear').ffill().bfill()

# Convert date and create unique hotspot IDs
dataset['date'] = pd.to_datetime(dataset['date'])
dataset['hotspot_id'] = dataset.groupby(['latitude', 'longitude']).ngroup() + 1

# Create lags and rolling statistics
for lag in range(1, 7):
    dataset[f'abundance_lag{lag}'] = dataset['squid_abundance_per_kgs'].shift(lag)
    dataset[f'sst_lag{lag}'] = dataset['sst'].shift(lag)
    dataset[f'chl_lag{lag}'] = dataset['chl'].shift(lag)
    dataset[f'ssh_lag{lag}'] = dataset['ssh'].shift(lag)

dataset['sst_rolling3'] = dataset['sst'].rolling(window=3).mean()
dataset['chl_rolling3'] = dataset['chl'].rolling(window=3).mean()
dataset['ssh_rolling3'] = dataset['ssh'].rolling(window=3).mean()
dataset['sst_rolling_std'] = dataset['sst'].rolling(window=3).std()
dataset['chl_rolling_std'] = dataset['chl'].rolling(window=3).std()
dataset['ssh_rolling_std'] = dataset['ssh'].rolling(window=3).std()

dataset = dataset.dropna().reset_index(drop=True)

class_counts = dataset['hotspot_id'].value_counts()
classes_to_keep = class_counts[class_counts >= 2].index
dataset = dataset[dataset['hotspot_id'].isin(classes_to_keep)]
dataset['hotspot_id'] = dataset.groupby(['latitude', 'longitude']).ngroup() + 1

features = ['sst', 'chl', 'ssh',
            'abundance_lag1', 'abundance_lag2', 'abundance_lag3', 'abundance_lag4', 'abundance_lag5', 'abundance_lag6',
            'sst_lag1', 'sst_lag2', 'sst_lag3', 'sst_lag4', 'sst_lag5', 'sst_lag6',
            'chl_lag1', 'chl_lag2', 'chl_lag3', 'chl_lag4', 'chl_lag5', 'chl_lag6',
            'ssh_lag1', 'ssh_lag2', 'ssh_lag3', 'ssh_lag4', 'ssh_lag5', 'ssh_lag6',
            'sst_rolling3', 'chl_rolling3', 'ssh_rolling3']

original_values = dataset['squid_abundance_per_kgs'].values
target_scaler = MinMaxScaler()
dataset['squid_abundance_per_kgs_scaled'] = target_scaler.fit_transform(original_values.reshape(-1, 1))

sequence_length = 12
X, y, hotspot_ids, dates = [], [], [], []
for hotspot_id in dataset['hotspot_id'].unique():
    hotspot_data = dataset[dataset['hotspot_id'] == hotspot_id]
    for i in range(len(hotspot_data) - sequence_length):
        X.append(hotspot_data[features].values[i:i + sequence_length])
        y.append(hotspot_data['squid_abundance_per_kgs'].values[i + sequence_length])
        hotspot_ids.append(hotspot_data['hotspot_id'].values[i + sequence_length])
        dates.append(hotspot_data['date'].values[i + sequence_length])

X, y, hotspot_ids, dates = np.array(X), np.array(y), np.array(hotspot_ids), np.array(dates)
label_encoder = LabelEncoder()
label_encoder.fit(hotspot_ids)
hotspot_ids_encoded = label_encoder.transform(hotspot_ids)

model = load_model(model_path)
hotspot_metadata = pd.read_csv(metadata_path)

def generate_predictions(hotspot_id, year, month):
    sequence_length = 10
    hotspot_data = dataset[dataset['hotspot_id'] == hotspot_id]
    last_sequence = hotspot_data[features].values[-sequence_length:]

    if last_sequence.shape[0] < sequence_length:
        return []  # Insufficient data for prediction

    future_predictions = []
    months_to_predict = (year - 2024) * 12 + (month)

    for _ in range(months_to_predict):
        next_pred = model.predict(
            [last_sequence[np.newaxis, :, :], np.array([[hotspot_id - 1]])]
        )[0, 0]
        future_predictions.append(next_pred)
        new_row = np.hstack(([next_pred], last_sequence[-1, 1:]))
        last_sequence = np.vstack([last_sequence[1:], new_row])

    if not future_predictions:  # Check if no predictions were generated
        return []

    future_predictions = np.array(future_predictions).reshape(-1, 1)
    try:
        future_predictions = target_scaler.inverse_transform(future_predictions)
    except ValueError:
        return []  # Handle cases where future_predictions is empty or invalid

    return future_predictions.flatten()

def create_heatmap_data(month_idx, predictions_dict):
    heatmap_data = []
    hotspot_details = []
    for hotspot_id, predictions in predictions_dict.items():
        if month_idx < len(predictions):
            try:
                matching_hotspots = hotspot_metadata[hotspot_metadata['hotspot_id'] == hotspot_id]
                if not matching_hotspots.empty:
                    lat = matching_hotspots['latitude'].values[0]
                    lon = matching_hotspots['longitude'].values[0]
                    value = float(predictions[month_idx])
                    
                    # Collect additional details
                    details = {
                        'hotspot_id': hotspot_id,
                        'latitude': lat,
                        'longitude': lon,
                        'abundance_value': value
                    }
                    
                    # Add any additional metadata from the CSV
                    for col in matching_hotspots.columns:
                        if col not in ['hotspot_id', 'latitude', 'longitude']:
                            details[col] = matching_hotspots[col].values[0]
                    
                    heatmap_data.append([lat, lon, value])
                    hotspot_details.append(details)
            except Exception as e:
                print(f"Error with hotspot {hotspot_id}: {e}")
    return heatmap_data, hotspot_details

def generate_graphs(predictions_dict, end_date):
    future_predictions_dict = {}
    final_values = {}

    for hotspot_id in range(1, 20):
        try:
            matching_hotspots = hotspot_metadata[hotspot_metadata['hotspot_id'] == hotspot_id]
            if not matching_hotspots.empty:
                lat = matching_hotspots['latitude'].values[0]
                lon = matching_hotspots['longitude'].values[0]

                hotspot_data = dataset[dataset['latitude'] == lat]
                hotspot_data = hotspot_data[hotspot_data['longitude'] == lon]

                if not hotspot_data.empty:
                    hotspot_sequences = hotspot_data[features].values[-sequence_length:]
                    last_sequence = hotspot_sequences
                    future_predictions = []

                    for _ in range(len(predictions_dict.get(hotspot_id, []))):
                        next_pred = model.predict(
                            [last_sequence[np.newaxis, :, :], np.array([[hotspot_id - 1]])]
                        )[0, 0]
                        future_predictions.append(next_pred)
                        new_row = np.hstack(([next_pred], last_sequence[-1, 1:]))
                        last_sequence = np.vstack([last_sequence[1:], new_row])

                    if future_predictions:
                        future_predictions = np.array(future_predictions).reshape(-1, 1)
                        future_predictions = target_scaler.inverse_transform(future_predictions).flatten()
                        future_predictions_dict[(lat, lon)] = future_predictions

                        final_value = future_predictions[-1]
                        final_values[hotspot_id] = final_value

        except Exception as e:
            print(f"Skipping hotspot {hotspot_id} due to error: {e}")

    return future_predictions_dict



@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    year = int(data['year'])
    month = int(data['month'])
    end_date = pd.Timestamp(year=year, month=month, day=1)

    predictions_dict = {}
    for hotspot_id in range(1, 20):
        predictions_dict[hotspot_id] = generate_predictions(hotspot_id, year, month)

    heatmaps = []
    detailed_hotspot_info = {}
    for month_idx in range(12):  # Assuming we want to show 12 months
        # Check if we have predictions for this month
        has_predictions = False
        for hotspot_id, predictions in predictions_dict.items():
            if month_idx < len(predictions):
                has_predictions = True
                break
        
        if not has_predictions:
            continue
            
        heatmap_data, hotspot_details = create_heatmap_data(month_idx, predictions_dict)
        if not heatmap_data:
            continue
            
        m = folium.Map(location=[(latitude_min + latitude_max) / 2, (longitude_min + longitude_max) / 2], zoom_start=10)
        
        # Add heatmap layer
        HeatMap(heatmap_data).add_to(m)
        
        # Add markers with abundance values and additional details
        for lat, lon, value in heatmap_data:
            # Find corresponding hotspot details
            hotspot_info = next((details for details in hotspot_details 
                                 if details['latitude'] == lat and details['longitude'] == lon), None)
            
            if hotspot_info:
                # Create a detailed popup with all available information
                popup_content = "<div style='font-size: 12px;'>"
                for key, val in hotspot_info.items():
                    popup_content += f"<b>{key.replace('_', ' ').title()}:</b> {val}<br>"
                popup_content += "</div>"
                
                # Create marker with popup
                folium.Marker(
                    location=[lat, lon],
                    popup=folium.Popup(popup_content, max_width=300),
                    tooltip=f"Hotspot {hotspot_info['hotspot_id']}",
                    icon=folium.DivIcon(
                        icon_size=(120, 36),
                        icon_anchor=(0, 0),
                        html=f'<div class="zoom-marker" style="display: none; font-size: 10pt; background-color: rgba(255, 255, 255, 0.7); '
                             f'border-radius: 4px; padding: 2px; width: auto; text-align: center;">'
                             f'Hotspot {hotspot_info["hotspot_id"]}: {value:.2f} kg</div>'
                    )
                ).add_to(m)
        
        # Add JavaScript to control marker visibility on zoom (same as before)
        zoom_script = """
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var map = document.querySelector('.folium-map');
            var markers = document.querySelectorAll('.zoom-marker');
            
            function toggleMarkers() {
                if (map.__zoom >= 11) { // Adjust this zoom level as needed
                    markers.forEach(function(marker) {
                        marker.style.display = 'block';
                    });
                } else {
                    markers.forEach(function(marker) {
                        marker.style.display = 'none';
                    });
                }
            }
            
            // Use MutationObserver to handle dynamic map creation
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        var mapElement = document.querySelector('.folium-map');
                        if (mapElement) {
                            mapElement.addEventListener('zoom', toggleMarkers);
                            toggleMarkers();
                        }
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
        </script>
        """
        m.get_root().html.add_child(folium.Element(zoom_script))
        
        # Add month information to the map
        month_date = end_date - pd.DateOffset(months=(12 - month_idx - 1))
        month_title = month_date.strftime('%b %Y')
        
        title_html = f'''
            <div style="position: fixed; top: 10px; left: 50px; width: 200px; height: 30px; 
                       background-color: white; border-radius: 5px; z-index: 900;">
                <h4 style="text-align: center; margin: 5px;">{month_title}</h4>
            </div>
        '''
        m.get_root().html.add_child(folium.Element(title_html))
        
        heatmaps.append(m._repr_html_())
        
        # Store detailed hotspot information for each month
        detailed_hotspot_info[month_title] = hotspot_details

    future_predictions_dict = generate_graphs(predictions_dict, end_date)
    graphs = {}
    for (lat, lon), future_predictions in future_predictions_dict.items():
        months = pd.date_range(start=end_date - pd.DateOffset(months=len(future_predictions) - 1),
                              end=end_date,
                              freq='MS').strftime('%b %Y').tolist()

        plt.figure(figsize=(10, 6))
        plt.plot(months, future_predictions, marker='o', linestyle='-', color='b',
                 label=f'Predicted Squid Abundance at ({lat}, {lon})')
        plt.xlabel('Month')
        plt.ylabel('Squid Abundance (kg)')
        plt.title(f'Predicted Squid Abundance at Hotspot ({lat}, {lon})')
        plt.xticks(rotation=45)
        plt.legend()
        plt.grid(True)
        plt.tight_layout()

        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        graph_url = base64.b64encode(img.getvalue()).decode()
        graphs[f'{lat},{lon}'] = f'data:image/png;base64,{graph_url}'
        plt.close()

    return jsonify(
        heatmaps=heatmaps, 
        graphs=graphs, 
        hotspot_details=detailed_hotspot_info
    )

if __name__ == '__main__':
    app.run(host="0.0.0.0",port=10000)