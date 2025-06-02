// Fetch environment configuration from env.json
const env = {};

// Immediately load the configuration
fetch('env.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load env.json: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        Object.assign(env, data);
        console.log('Environment configuration loaded');
    })
    .catch(error => {
        console.error('Error loading environment configuration:', error);
    });

class Twitch {
    constructor(){
        // Initialize OAuth token
        this.OAuthToken = null;
        const query = new URLSearchParams(window.location.hash.substring(1));
        if (query.has('access_token')) {
            this.OAuthToken = query.get('access_token');
            console.log('Twitch OAuth Token:', this.OAuthToken);
        } else if (query.has('error')) {
            console.error('Twitch OAuth Error:', query.get('error'), "\nDescription:", query.get('error_description'));
        }

        this.verifyOAuth();
    }

    authURL() {
        // Implement OAuth 2.0 authentication flow
        window.open(
            `https://id.twitch.tv/oauth2/authorize?response_type=token` + 
            `&client_id=${env.TWITCH_PUBLIC_CLIENT_ID}` + 
            `&redirect_uri=${env.TWITCH_REDIRECT_URI}` +
            `&scope=channel:manage:broadcast`,
            '_self', 'width=600,height=400'
        );
    }

    // function to verify oauth
    async verifyOAuth(){
        if (!this.OAuthToken) {
            console.error('No OAuth token found. Please authenticate first.');
            return false;
        }

        try {
            const response = await xhrRequest('GET', 'https://id.twitch.tv/oauth2/validate', 
                                            { 'Authorization': `Bearer ${this.OAuthToken}` });
            if (response) {
                console.log('OAuth token is valid.');

                this.userId = response.user_id;
                this.userLogin = response.login;
                this.expiresIn = response.expires_in;

                return true;
            } else {
                console.error('Invalid OAuth token.');
                return false;
            }
        } catch (error) {
            console.error('Error verifying OAuth token:', error);
            return false;
        }


        return true;
    }

    // function to get current stream info
    async getCurrentStreamInfo() {
        if (!this.OAuthToken) {
            console.error('No OAuth token found. Please authenticate first.');
            return null;
        }

        try {
            const response = await xhrRequest('GET', 
                        `https://api.twitch.tv/helix/streams?user_id=${this.userId}`, 
                        { 'Client-ID': env.TWITCH_PUBLIC_CLIENT_ID, 
                        'Authorization': `Bearer ${this.OAuthToken}` });
            console.log(response);
            if (response.data && response.data.length > 0) {
                
                return response.data[0]; // Return the first stream info
            } else {
                console.log('No active streams found for this user.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching current stream info:', error);
            return null;
        }
    }
    fillCurrentStreamInfo() { // FIX: seemingly not working on offline
        const streamInfo = this.getCurrentStreamInfo();
        if (!streamInfo) { return; }
        
        console.log(streamInfo);
        

        // document.getElementById('stream-title').value = streamInfo.title || '';
        // document.getElementById('go-live-notification').value = streamInfo.tag_ids.join(', ') || '';
        // document.getElementById('category-search').value = streamInfo.game_name || '';
        // // Additional fields can be filled here
        
        
    }
    // function to post new stream info
    async postStreamInfo(streamData) {
        if (!this.OAuthToken) {
            console.error('No OAuth token found. Please authenticate first.');
            return false;
        }

        try {
            const response = await xhrRequest('PATCH',
                'https://api.twitch.tv/helix/channels?broadcaster_id=' + this.userId, 
                { 
                    'Client-ID': env.TWITCH_PUBLIC_CLIENT_ID, 
                    'Authorization': `Bearer ${this.OAuthToken}`,
                    'Content-Type': 'application/json'
                }, 
                JSON.stringify(streamData)
            );
            console.log('Stream info posted successfully:', response);
            return true;
        } catch (error) {
            console.error('Error posting stream info:', error);
            return false;
        }
    }

}

class XHRError extends Error {
    constructor(status, statusText) {
        super(`XHR Error: ${status} ${statusText}`);
        this.name = 'XHR Error';
        this.status = status;
        this.statusText = statusText;
    }
}

async function xhrRequest(method, url, headers = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
        });

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new XHRError(xhr.status, xhr.statusText));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error'));
        };
        
        xhr.send();
    });

}


const twitch = new Twitch();

const connectTwitchBTN = document.getElementById('twitch-button');
connectTwitchBTN.addEventListener('click', function() {
    twitch.authURL();
    console.log('Twitch authentication initiated');
});


// Sample category data
const twitchCategories = [
    {
        id: 1,
        title: "Just Chatting",
        viewers: "185K",
        followers: "31.1M",
        tags: ["IRL"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/509658-40x53.jpg"
    },
    {
        id: 2,
        title: "Just Dance 2025 Edition",
        viewers: "14",
        followers: "2K",
        tags: ["Rythm & Music Game", "Party"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/516575-40x53.jpg"
    },
    {
        id: 3,
        title: "Just Another Night Shift",
        viewers: "",
        followers: "77",
        tags: ["Simulation", "Indie Game", "Action"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/1469308723-40x53.jpg"
    },
    {
        id: 4,
        title: "Just Cating",
        viewers: "26",
        followers: "1.8K",
        tags: ["IRL"],   
        image: "https://static-cdn.jtvnw.net/ttv-boxart/509658-40x53.jpg"
    },
    {
        id: 5,
        title: "Just Dance",
        viewers: "",
        followers: "28.5K",
        tags: ["Rythm & Music Game", "Party"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/33214-40x53.jpg"
    },
    {
        id: 6,
        title: "Just Dance 2022",
        viewers: "",
        followers: "113K",
        tags: ["Rythm & Music Game", "Party"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/518012-40x53.jpg"
    },
    {
        id: 7,
        title: "Minecraft",
        viewers: "89.2K",
        followers: "47.3M",
        tags: ["Simulation", "Adventure"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-40x53.jpg"
    },
    {
        id: 8,
        title: "League of Legends",
        viewers: "234K",
        followers: "67.8M",
        tags: ["RPG", "Strategy", "MOBA", "Action"],
        image: "https://static-cdn.jtvnw.net/ttv-boxart/21779-40x53.jpg"
    }
];

// Sample tag suggestions
const twitchTagSuggestions = [
    "MinecraftFreizeitpark",
    "minecraftplays", 
    "min",
    "minecraftchillplay",
    "minaashidofan",
    "minecraftgaminglive",
    "MinecraftPY",
    "minecraft",
    "gaming",
    "chill",
    "chatting",
    "english",
    "fun",
    "community",
    "interactive",
    "wholesome"
];

// Done button functionality (placeholder)
document.getElementById('done-button').addEventListener('click', function() {
    const data = {
        title: document.getElementById('stream-title').value,
        notification: document.getElementById('go-live-notification').value,
        category: document.getElementById('category-search').value,
        tags: selectedTags,
        rerun: document.getElementById('rerun-checkbox').checked,
        brandedContent: document.getElementById('branded-content-checkbox').checked,
        language: document.getElementById('stream-language').value,
        classifications: selectedClassifications
    }
    console.log('Stream data to be posted:', data);
    twitch.postStreamInfo(data);
});