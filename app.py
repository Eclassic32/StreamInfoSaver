import os
import json
import requests
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from dotenv import load_dotenv
import urllib.parse

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Twitch API configuration
TWITCH_CLIENT_ID = os.getenv('TWITCH_CLIENT_ID')
TWITCH_CLIENT_SECRET = os.getenv('TWITCH_CLIENT_SECRET')
TWITCH_REDIRECT_URI = os.getenv('TWITCH_REDIRECT_URI')
TWITCH_PUBLIC_CLIENT_ID = os.getenv('TWITCH_PUBLIC_CLIENT_ID')

# File paths
PRESETS_FILE = 'stream_presets.json'
CURRENT_STREAM_FILE = 'current_stream.json'

class TwitchAPI:
    def __init__(self):
        self.access_token = None
        self.user_id = None
        
    def get_auth_url(self):
        """Generate Twitch OAuth authorization URL"""
        params = {
            'client_id': TWITCH_CLIENT_ID,
            'redirect_uri': TWITCH_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'channel:manage:broadcast channel:read:stream_key user:read:email'
        }
        return f"https://id.twitch.tv/oauth2/authorize?{urllib.parse.urlencode(params)}"
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        data = {
            'client_id': TWITCH_CLIENT_ID,
            'client_secret': TWITCH_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': TWITCH_REDIRECT_URI
        }
        
        response = requests.post('https://id.twitch.tv/oauth2/token', data=data)
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data['access_token']
            return True
        return False
    
    def get_user_info(self):
        """Get current user information"""
        if not self.access_token:
            return None
            
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Client-Id': TWITCH_CLIENT_ID
        }
        
        response = requests.get('https://api.twitch.tv/helix/users', headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data['data']:
                self.user_id = data['data'][0]['id']
                return data['data'][0]
        return None
    
    def get_stream_info(self):
        """Get current stream information"""
        if not self.access_token or not self.user_id:
            return None
            
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Client-Id': TWITCH_CLIENT_ID
        }
        
        # Get channel information
        response = requests.get(f'https://api.twitch.tv/helix/channels?broadcaster_id={self.user_id}', headers=headers)
        if response.status_code == 200:
            return response.json()
        return None
    
    def update_stream_info(self, stream_data):
        """Update stream information on Twitch"""
        if not self.access_token or not self.user_id:
            return False
            
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Client-Id': TWITCH_CLIENT_ID,
            'Content-Type': 'application/json'
        }
        
        # Prepare data for Twitch API
        update_data = {}
        if 'title' in stream_data:
            update_data['title'] = stream_data['title']
        if 'categoryId' in stream_data:
            update_data['game_id'] = stream_data['categoryId']
        if 'language' in stream_data:
            update_data['broadcaster_language'] = stream_data['language']
        if 'tags' in stream_data:
            update_data['tags'] = stream_data['tags']
        
        response = requests.patch(
            f'https://api.twitch.tv/helix/channels?broadcaster_id={self.user_id}',
            headers=headers,
            json=update_data
        )
        
        return response.status_code == 204
    
    def get_categories(self, query=''):
        """Search for game/category by name"""
        if not self.access_token:
            return []
            
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Client-Id': TWITCH_CLIENT_ID
        }
        
        params = {'name': query} if query else {}
        response = requests.get('https://api.twitch.tv/helix/games', headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json().get('data', [])
        return []

# Initialize Twitch API
twitch_api = TwitchAPI()

def load_presets():
    """Load stream presets from JSON file"""
    try:
        with open(PRESETS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return default preset structure if file doesn't exist
        return []

def save_presets(presets):
    """Save stream presets to JSON file"""
    with open(PRESETS_FILE, 'w', encoding='utf-8') as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)

def load_current_stream():
    """Load current stream info from JSON file"""
    try:
        with open(CURRENT_STREAM_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def save_current_stream(stream_info):
    """Save current stream info to JSON file"""
    with open(CURRENT_STREAM_FILE, 'w', encoding='utf-8') as f:
        json.dump(stream_info, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    """Main page"""
    if 'access_token' not in session:
        return render_template('auth.html', auth_url=twitch_api.get_auth_url())
    
    presets = load_presets()
    current_stream = load_current_stream()
    return render_template('index.html', presets=presets, current_stream=current_stream)

@app.route('/auth/callback')
def auth_callback():
    """Handle Twitch OAuth callback"""
    code = request.args.get('code')
    if code and twitch_api.exchange_code_for_token(code):
        user_info = twitch_api.get_user_info()
        if user_info:
            session['access_token'] = twitch_api.access_token
            session['user_id'] = twitch_api.user_id
            session['username'] = user_info['display_name']
            return redirect(url_for('index'))
    
    return "Authentication failed", 400

@app.route('/logout')
def logout():
    """Logout and clear session"""
    session.clear()
    return redirect(url_for('index'))

@app.route('/api/stream/current')
def get_current_stream():
    """Get current stream information from Twitch"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    twitch_api.access_token = session['access_token']
    twitch_api.user_id = session['user_id']
    
    stream_info = twitch_api.get_stream_info()
    if stream_info:
        # Save to file
        save_current_stream(stream_info)
        return jsonify(stream_info)
    
    return jsonify({'error': 'Failed to get stream info'}), 500

@app.route('/api/stream/update', methods=['POST'])
def update_stream():
    """Update stream information on Twitch"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    twitch_api.access_token = session['access_token']
    twitch_api.user_id = session['user_id']
    
    stream_data = request.json
    success = twitch_api.update_stream_info(stream_data)
    
    if success:
        # Update current stream file
        current_stream = load_current_stream() or {}
        current_stream.update(stream_data)
        current_stream['lastModified'] = datetime.now().isoformat()
        save_current_stream(current_stream)
        
        return jsonify({'success': True, 'message': 'Stream information updated successfully'})
    
    return jsonify({'error': 'Failed to update stream info'}), 500

@app.route('/api/presets')
def get_presets():
    """Get all presets"""
    return jsonify(load_presets())

@app.route('/api/presets', methods=['POST'])
def create_preset():
    """Create a new preset"""
    data = request.json
    presets = load_presets()
    
    new_preset = {
        'name': data['name'],
        'description': data.get('description', ''),
        'lastModified': datetime.now().isoformat(),
        'info': data['info']
    }
    
    presets.append(new_preset)
    save_presets(presets)
    
    return jsonify({'success': True, 'preset': new_preset})

@app.route('/api/presets/<preset_name>', methods=['PUT'])
def update_preset(preset_name):
    """Update an existing preset"""
    data = request.json
    presets = load_presets()
    
    for preset in presets:
        if preset['name'] == preset_name:
            preset.update(data)
            preset['lastModified'] = datetime.now().isoformat()
            save_presets(presets)
            return jsonify({'success': True, 'preset': preset})
    
    return jsonify({'error': 'Preset not found'}), 404

@app.route('/api/presets/<preset_name>', methods=['DELETE'])
def delete_preset(preset_name):
    """Delete a preset"""
    presets = load_presets()
    presets = [p for p in presets if p['name'] != preset_name]
    save_presets(presets)
    
    return jsonify({'success': True})

@app.route('/api/presets/<preset_name>/apply', methods=['POST'])
def apply_preset(preset_name):
    """Apply a preset to current stream"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    presets = load_presets()
    preset = next((p for p in presets if p['name'] == preset_name), None)
    
    if not preset:
        return jsonify({'error': 'Preset not found'}), 404
    
    twitch_api.access_token = session['access_token']
    twitch_api.user_id = session['user_id']
    
    success = twitch_api.update_stream_info(preset['info'])
    
    if success:
        # Update current stream file
        current_stream = load_current_stream() or {}
        current_stream.update(preset['info'])
        current_stream['lastModified'] = datetime.now().isoformat()
        save_current_stream(current_stream)
        
        return jsonify({'success': True, 'message': f'Preset "{preset_name}" applied successfully'})
    
    return jsonify({'error': 'Failed to apply preset'}), 500

@app.route('/api/categories/search')
def search_categories():
    """Search for game categories"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    query = request.args.get('q', '')
    twitch_api.access_token = session['access_token']
    
    categories = twitch_api.get_categories(query)
    return jsonify(categories)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)
