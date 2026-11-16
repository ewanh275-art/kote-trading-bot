import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "Kote Backend is live!",
        "endpoint": "/api/pools"
    })

@app.route('/api/pools', methods=['GET'])
def get_pools():
    try:
        dedust_pools = requests.get('https://api.dedust.io/v2/pools', timeout=10).json()
        dedust_assets = requests.get('https://api.dedust.io/v2/assets', timeout=10).json()
        stonfi_pools = requests.get('https://api.ston.fi/v1/pools', timeout=10).json()
        return jsonify({
            "success": True,
            "dedust_pools": dedust_pools,
            "dedust_assets": dedust_assets,
            "stonfi_pools": stonfi_pools
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
