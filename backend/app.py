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
CORS(app)

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

dataset = dataset.interpolate(method='linear').fillna(method='ffill').fillna(method='bfill')

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

sequence_length = 10
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

hotspot_metadata = pd.read_csv(metadata_path)

def create_heatmap_data(month_idx, predictions):
    heatmap_data = []
    for i, hotspot_id in enumerate(hotspot_metadata['hotspot_id']):
        lat = hotspot_metadata[hotspot_metadata['hotspot_id'] == hotspot_id]['latitude'].values[0]
        lon = hotspot_metadata[hotspot_metadata['hotspot_id'] == hotspot_id]['longitude'].values[0]
        heatmap_data.append([lat, lon, float(predictions[month_idx])])
    return heatmap_data

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
    for hotspot_id, predictions in predictions_dict.items():
        for month_idx in range(len(predictions)):
            heatmap_data = create_heatmap_data(month_idx, predictions)
            m = folium.Map(location=[(latitude_min + latitude_max) / 2, (longitude_min + longitude_max) / 2], zoom_start=10)
            HeatMap(heatmap_data).add_to(m)
            heatmaps.append(m._repr_html_())

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

    return jsonify(heatmaps=heatmaps, graphs=graphs)

if __name__ == '__main__':
    app.run(debug=True)
