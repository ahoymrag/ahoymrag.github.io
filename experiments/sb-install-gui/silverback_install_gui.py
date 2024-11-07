from flask import Flask, render_template, jsonify
import subprocess
import os
import sys

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/install_silverback', methods=['POST'])
def install_silverback():
    try:
        # Create virtual environment if it doesn't exist
        if not os.path.exists("my_venv"):
            subprocess.run([sys.executable, "-m", "venv", "my_venv"], check=True)
        
        # Install Silverback in the virtual environment
        subprocess.run(["my_venv/bin/pip", "install", "silverback"], check=True)
        
        # Open a new terminal window and activate the virtual environment
        # MacOS and Linux
        if sys.platform.startswith('darwin') or sys.platform.startswith('linux'):
            subprocess.Popen(["gnome-terminal", "--", "bash", "-c", "source my_venv/bin/activate && exec bash"])
        # Windows
        elif sys.platform.startswith('win'):
            subprocess.Popen(["cmd.exe", "/k", "my_venv\\Scripts\\activate"])
        
        return jsonify({"status": "success", "output": "Silverback installed successfully!"})
    
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "output": e.stderr}), 500

if __name__ == '__main__':
    app.run(debug=True)