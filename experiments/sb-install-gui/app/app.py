from flask import Flask, render_template, request, jsonify
import subprocess
import sys
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/install_silverback', methods=['POST'])
def install_silverback():
    try:
        # Create virtual environment if it doesn't exist
        if not os.path.exists("silverback_venv"):
            subprocess.run([sys.executable, "-m", "venv", "silverback_venv"], check=True)
        
        # Install Silverback in the virtual environment
        result = subprocess.run(["silverback_venv/bin/pip", "install", "silverback"],
                                capture_output=True, text=True, check=True)
        
        return jsonify({"status": "success", "output": result.stdout})
    
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "output": e.stderr}), 500

if __name__ == '__main__':
    app.run(debug=True)