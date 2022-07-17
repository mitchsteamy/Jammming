//@ts-check

let userAccessToken;
const clientId = "96df7ae8f53c46f9ba0181c8cde69f21";
const redirectUri = "http://localhost:3000/"

const Spotify = {
    getAccessToken() {
        if (userAccessToken) {
            return userAccessToken;
        }

        // Check for access token match.
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            userAccessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            //This clear parameters. Allows us to grab new access token if current expires.
            window.setTimeout(() => userAccessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return userAccessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    search(searchTerm) {
        const accessToken = Spotify.getAccessToken()
        const urlToFetch = `https://api.spotify.com/v1/search?type=track&q=${searchTerm}`
        const authHeader = { Authorization: `Bearer ${accessToken}` }
        return fetch(urlToFetch, { headers: authHeader }
        ).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    savePlaylist(playlistName, trackUris) {
        if (!playlistName || !trackUris.length) {
            return;
        }

        let userId;
        let playlistId;
        const accessToken = Spotify.getAccessToken();
        const urlToFetchUserId = "https://api.spotify.com/v1/me"
        const urlToFetchPlaylistId = `https://api.spotify.com/v1/users/${userId}/playlists`;
        const urlToFetchTrackUris = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`;
        const authHeader = { Authorization: `Bearer ${accessToken}` };

        return fetch(urlToFetchUserId, { headers: authHeader }
        ).then(response => {
            return response.json();
        }).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(urlToFetchPlaylistId, {
                headers: authHeader,
                method: "POST",
                body: JSON.stringify({ name: playlistName })
            }).then(response => {
                return response.json();
            }).then(jsonResponse => {
                playlistId = jsonResponse.id;
                return fetch(urlToFetchTrackUris, {
                    headers: authHeader,
                    method: "POST",
                    body: JSON.stringify({ uris: trackUris })
                });
            });
        });
    }
};

export default Spotify;