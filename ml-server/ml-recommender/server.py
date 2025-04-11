from flask import Flask, request, jsonify
import random

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"message": "ML server is running!"})

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()

    top_tracks = data.get("top_tracks", [])
    recently_played = data.get("recently_played", [])

    print(f"Received top tracks: {top_tracks}")
    print(f"Received recently played: {recently_played}")

    # Dummy recommendation logic (shuffle + top 10 unique)
    combined = list(set(top_tracks + recently_played))
    random.shuffle(combined)
    recommended = combined[:10]

    return jsonify({
        "status": "success",
        "recommended_tracks": recommended
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
