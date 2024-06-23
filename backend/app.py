import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from flask import Flask, request, jsonify
from flask_cors import CORS
import folium
from folium.plugins import HeatMap
import matplotlib
matplotlib.use('Agg')  # Use the Agg backend
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

# Load data
data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lokus.csv')
data = pd.read_csv(data_path)

# Data preprocessing
latitude_min, latitude_max = 11, 12
longitude_min, longitude_max = 123, 124
filtered_data = data[(data['latitude'] >= latitude_min) & (data['latitude'] <= latitude_max) &
                     (data['longitude'] >= longitude_min) & (data['longitude'] <= longitude_max)]

filtered_data['date'] = pd.to_datetime(filtered_data['date'], format='%m/%d/%Y')
filtered_data['month'] = filtered_data['date'].dt.month
filtered_data['quarter'] = filtered_data['date'].dt.quarter
filtered_data['sst'] = pd.to_numeric(filtered_data['sst'], errors='coerce')
filtered_data['chl'] = pd.to_numeric(filtered_data['chl'], errors='coerce')
filtered_data['ssh'] = pd.to_numeric(filtered_data['ssh'], errors='coerce')
filtered_data.dropna(subset=['sst', 'chl', 'ssh'], inplace=True)
filtered_data['log_catch'] = np.log1p(filtered_data['squid_abundance_per_kgs'])

# Create additional features
filtered_data['sst_chl_ratio'] = filtered_data['sst'] / (filtered_data['chl'] + 1e-6)
filtered_data['sst_ssh_ratio'] = filtered_data['sst'] / (filtered_data['ssh'] + 1e-6)
filtered_data['chl_ssh_ratio'] = filtered_data['chl'] / (filtered_data['ssh'] + 1e-6)

# Load model
model = load_model(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'best_model.keras'))

# Feature and target scaling
feature_cols = ['sst', 'chl', 'ssh', 'sst_chl_ratio', 'sst_ssh_ratio', 'chl_ssh_ratio']
target_col = 'log_catch'
scaler_features = MinMaxScaler()
scaler_target = MinMaxScaler()
scaled_features = scaler_features.fit_transform(filtered_data[feature_cols])
scaled_target = scaler_target.fit_transform(filtered_data[[target_col]])

# Function to create sequences for model prediction
def create_sequences(data, seq_length):
    sequences = []
    for i in range(len(data) - seq_length + 1):
        seq = data[i:i+seq_length]
        sequences.append((seq, None, None))  # Placeholder None values to match expected tuple length
    return sequences

# Function to generate predictions
def generate_predictions(year, month):
    sequence_length = 12
    last_sequence = scaled_features[-sequence_length:]
    
    if last_sequence.shape[1] != model.input_shape[2]:
        raise ValueError(f"Expected {model.input_shape[2]} features, but got {last_sequence.shape[1]} features")

    future_predictions = []
    months_to_predict = (year - 2023) * 12 + (month - 1)  # Calculate the number of months to predict
    for _ in range(months_to_predict):
        next_pred = model.predict(last_sequence[np.newaxis, :, :])[0, 0]
        future_predictions.append(next_pred)
        new_row = np.array([next_pred] + list(last_sequence[-1, 1:]))
        last_sequence = np.vstack([last_sequence[1:], new_row])

    future_predictions = scaler_target.inverse_transform(np.array(future_predictions).reshape(-1, 1)).flatten()
    return future_predictions

# Function to create heatmap data
def create_heatmap_data(month_idx, predictions):
    heatmap_data = []
    for i in range(len(filtered_data['latitude'])):
        lat = filtered_data['latitude'].iloc[i]
        lon = filtered_data['longitude'].iloc[i]
        heatmap_data.append([lat, lon, float(predictions[month_idx])])
    return heatmap_data

# Function to generate graphs for each hotspot
def generate_graphs(predictions, end_date):
    unique_hotspots = filtered_data[['latitude', 'longitude']].drop_duplicates().values
    future_predictions_dict = {}

    for hotspot in unique_hotspots:
        lat, lon = hotspot
        hotspot_data = filtered_data[(filtered_data['latitude'] == lat) & (filtered_data['longitude'] == lon)]

        hotspot_sequences = create_sequences(hotspot_data[feature_cols].values, 12)

        if len(hotspot_sequences) == 0:
            continue

        X_hotspot = np.array([seq for seq, _, _ in hotspot_sequences])

        last_sequence = X_hotspot[-1]
        future_predictions = []

        for _ in range(len(predictions)):
            next_pred = model.predict(last_sequence[np.newaxis, :, :])[0, 0]
            future_predictions.append(next_pred)
            new_row = np.array([next_pred] + list(last_sequence[-1, 1:]))
            last_sequence = np.vstack([last_sequence[1:], new_row])

        future_predictions = np.array(future_predictions).reshape(-1, 1)
        future_predictions = scaler_target.inverse_transform(future_predictions)

        future_predictions_dict[(lat, lon)] = future_predictions

    return future_predictions_dict

# Endpoint to generate predictions
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    year = int(data['year'])
    month = int(data['month'])
    end_date = pd.Timestamp(year=year, month=month, day=1)
    predictions = generate_predictions(year, month)
    
    heatmaps = []
    for month_idx in range(1):
        heatmap_data = create_heatmap_data(month_idx, predictions)
        m = folium.Map(location=[(latitude_min + latitude_max) / 2, (longitude_min + longitude_max) / 2], zoom_start=10)
        HeatMap(heatmap_data).add_to(m)
        heatmaps.append(m._repr_html_())  # Get the HTML representation of the map

        
    future_predictions_dict = generate_graphs(predictions, end_date)
    graphs = {}
    for hotspot, future_predictions in future_predictions_dict.items():
        lat, lon = hotspot
        months = pd.date_range(start='2023-01-01', end=end_date, freq='MS').strftime('%b %Y').tolist()
        plt.figure(figsize=(10, 6))
        plt.plot(months[:len(future_predictions)], future_predictions, marker='o', linestyle='-', color='b', label=f'Predicted Squid Abundance at ({lat}, {lon})')
        plt.xlabel('Month')
        plt.ylabel('Squid Abundance (kg)')
        plt.title(f'Predicted Squid Abundance at Hotspot ({lat}, {lon})')
        plt.legend()
        plt.grid(True)
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        graph_url = base64.b64encode(img.getvalue()).decode()
        graphs[f'{lat},{lon}'] = f'data:image/png;base64,{graph_url}'
        plt.close()

    return jsonify(heatmaps=heatmaps, graphs=graphs)

if __name__ == '__main__':
    app.run(debug=True)
