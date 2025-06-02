# Stream Info Manager

A Flask web application for managing Twitch stream information with preset functionality. Perfect for OBS dock integration.

## Features

- **Twitch OAuth Authentication** - Secure login with your Twitch account
- **Real-time Stream Management** - Update title, category, tags, and language
- **Preset System** - Save and quickly apply stream configurations
- **Category Search** - Easy game/category selection with search
- **Tag Management** - Add and remove stream tags with ease
- **OBS Dock Ready** - Responsive design perfect for OBS browser docks
- **Modern UI** - Dark theme with Twitch branding

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file is already configured with your Twitch application credentials:

- `TWITCH_CLIENT_ID` - Your Twitch application client ID
- `TWITCH_CLIENT_SECRET` - Your Twitch application client secret
- `TWITCH_PUBLIC_CLIENT_ID` - Public client ID (if using public client type)
- `TWITCH_REDIRECT_URI` - OAuth redirect URI (http://localhost:3000/auth/callback)

### 3. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:3000`

### 4. First Use

1. Navigate to `http://localhost:3000`
2. Click "Connect with Twitch" to authenticate
3. Grant the required permissions
4. Start managing your stream information!

## Usage

### Managing Stream Information

- **Update Current Stream**: Modify title, category, language, and tags in real-time
- **Load Current Info**: Click "Refresh" to load your current Twitch stream settings
- **Save Changes**: Click "Update Stream" to apply changes to your live stream

### Working with Presets

- **Apply Preset**: Click "Apply" on any preset to instantly update your stream
- **Create Preset**: Use "Save as Preset" or "New Preset" to save current settings
- **Edit Preset**: Modify existing presets (feature can be extended)
- **Delete Preset**: Remove unwanted presets

### OBS Integration

To add this as an OBS dock:

1. In OBS, go to **View** → **Docks** → **Custom Browser Docks**
2. Set the URL to `http://localhost:3000`
3. Set a title like "Stream Manager"
4. Click "Apply"

The responsive design will automatically adjust to the dock size.

## File Structure

- `app.py` - Main Flask application with Twitch API integration
- `templates/` - HTML templates
  - `index.html` - Main application interface
  - `auth.html` - Authentication page
- `static/` - Static assets (CSS, JS)
- `stream_presets.json` - Stored stream presets
- `current_stream.json` - Current stream information cache
- `.env` - Environment variables (Twitch app credentials)

## API Endpoints

- `GET /` - Main application page
- `GET /auth/callback` - Twitch OAuth callback
- `GET /api/stream/current` - Get current stream information
- `POST /api/stream/update` - Update stream information
- `GET /api/presets` - Get all presets
- `POST /api/presets` - Create new preset
- `PUT /api/presets/<name>` - Update preset
- `DELETE /api/presets/<name>` - Delete preset
- `POST /api/presets/<name>/apply` - Apply preset to stream
- `GET /api/categories/search` - Search game categories

## Required Twitch API Scopes

The application requires the following Twitch API scopes:

- `channel:manage:broadcast` - To update stream information
- `channel:read:stream_key` - To read channel information
- `user:read:email` - For user identification

## Troubleshooting

### Authentication Issues
- Ensure your Twitch application redirect URI matches `TWITCH_REDIRECT_URI` in `.env`
- Verify your client ID and secret are correct
- Make sure the application is running on port 3000

### Stream Update Issues
- Check that you have the required Twitch API scopes
- Ensure you're authenticated and the session hasn't expired
- Verify the stream is live (some operations require an active stream)

### OBS Dock Issues
- Make sure the Flask app is running before adding the dock
- Use `http://localhost:3000` as the URL, not `https://`
- Clear the dock cache if changes don't appear: Right-click dock → Refresh

## Development

The application is built with:
- **Flask** - Python web framework
- **Bootstrap 5** - CSS framework
- **Font Awesome** - Icons
- **Twitch API** - Stream management
- **JavaScript** - Frontend interactivity

To extend functionality, modify the relevant sections in `app.py` for backend logic or update the templates for UI changes.
