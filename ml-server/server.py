import pandas as pd
import random
from flask import Flask, request, jsonify
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import numpy as np

app = Flask(__name__)

# --- SETTINGS ---
POPULARITY_THRESHOLD = 30

# --- EXPANDED MOOD PROFILES ---
mood_profiles = {
    'happy': {'valence': 0.8, 'energy': 0.8, 'danceability': 0.8},
    'sad': {'valence': 0.2, 'energy': 0.2, 'acousticness': 0.8},
    'energetic': {'valence': 0.7, 'energy': 0.9, 'danceability': 0.85, 'tempo': 160},
    'chill': {'valence': 0.4, 'energy': 0.2, 'danceability': 0.5, 'acousticness': 0.9, 'tempo': 90},
    'party': {'danceability': 0.9, 'energy': 0.85, 'valence': 0.8},
    'workout': {'energy': 0.9, 'tempo': 140, 'danceability': 0.75},
    'focus': {'instrumentalness': 0.8, 'acousticness': 0.6, 'energy': 0.3},
    'romance': {'valence': 0.6, 'energy': 0.4, 'acousticness': 0.7}
}

# --- MODEL AND DATA LOADING ---
try:
    df = pd.read_csv('spotify_data.csv')
    if 'id' in df.columns:
        df.rename(columns={'id': 'track_id'}, inplace=True)

    # Deduplicate the initial dataset based on track_id
    df.drop_duplicates(subset=['track_id'], keep='first', inplace=True)
    df.reset_index(drop=True, inplace=True)

except FileNotFoundError:
    print("ERROR: spotify_data.csv not found. Please download a dataset.")
    df = pd.DataFrame()

if not df.empty:
    df['popularity'] = pd.to_numeric(df['popularity'], errors='coerce')
    df.dropna(subset=['popularity'], inplace=True)

    # Define all possible feature columns
    all_feature_cols = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo', 'valence']
    # Use only the feature columns that actually exist in the loaded DataFrame
    feature_cols = [col for col in all_feature_cols if col in df.columns]
    
    song_features_df = df[feature_cols]
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(song_features_df)
    
    knn_model = NearestNeighbors(n_neighbors=50, algorithm='ball_tree')
    knn_model.fit(scaled_features)
    
    print("Model and data loaded successfully.")

# --- DEDUPLICATION HELPER FUNCTION ---
def deduplicate_list(data_list):
    # This preserves order and removes duplicates
    return list(dict.fromkeys(data_list))

# --- API ENDPOINTS ---
@app.route("/")
def home():
    return jsonify({"message": "ML server is running!"})

@app.route("/recommend", methods=["POST"])
def recommend():
    if df.empty: return jsonify({"error": "Dataset not loaded"}), 500
    data = request.get_json()
    input_tracks = data.get("top_tracks", []) + data.get("recently_played", [])
    if not input_tracks: return jsonify({"error": "No input tracks provided"}), 400
    user_tracks_df = df[df['track_id'].isin(input_tracks)]
    if user_tracks_df.empty: return jsonify({"error": "None of the input tracks were found in the dataset"}), 404
    user_features = user_tracks_df[feature_cols]
    user_avg_features = user_features.mean().values.reshape(1, -1)
    scaled_user_avg = scaler.transform(user_avg_features)
    distances, indices = knn_model.kneighbors(scaled_user_avg)
    recommended_df = df.iloc[indices[0]]
    popular_recommendations = recommended_df[recommended_df['popularity'] >= POPULARITY_THRESHOLD]
    popular_track_ids = popular_recommendations['track_id'].tolist()
    new_recommendations = [tid for tid in popular_track_ids if tid not in input_tracks]
    
    unique_recommendations = deduplicate_list(new_recommendations)
    
    if len(unique_recommendations) > 10:
        final_recommendations = random.sample(unique_recommendations, 10)
    else:
        final_recommendations = unique_recommendations
        
    return jsonify({"status": "success", "recommended_tracks": final_recommendations})

@app.route("/recommend_mood", methods=["POST"])
def recommend_mood():
    if df.empty:
        return jsonify({"error": "Dataset not loaded"}), 500

    data = request.get_json()
    mood = data.get("mood")

    if not mood or mood not in mood_profiles:
        return jsonify({"error": "Invalid mood provided"}), 400

    profile = mood_profiles[mood]
    target_vector = df[feature_cols].mean()

    for feature, value in profile.items():
        if feature in target_vector:
            target_vector[feature] = value

    scaled_target = scaler.transform(target_vector.values.reshape(1, -1))
    distances, indices = knn_model.kneighbors(scaled_target)

    recommended_df = df.iloc[indices[0]]
    popular_recommendations = recommended_df[recommended_df['popularity'] >= POPULARITY_THRESHOLD]
    popular_track_ids = popular_recommendations['track_id'].tolist()

    unique_recommendations = deduplicate_list(popular_track_ids)
    random.shuffle(unique_recommendations)  # 🔁 Ensures different order each time

    final_recommendations = unique_recommendations[:10]  # Pick top 10 after shuffling

    return jsonify({"status": "success", "recommended_tracks": final_recommendations})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
