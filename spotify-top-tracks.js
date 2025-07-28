require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // cache 1 jam

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_USER_ID,
  PORT = 3000,
} = process.env;

async function getSpotifyAccessToken() {
  const cached = cache.get('spotify_token');
  if (cached) return cached;
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  cache.set('spotify_token', resp.data.access_token, resp.data.expires_in - 60);
  return resp.data.access_token;
}

app.get('/top-tracks', async (req, res) => {
  try {
    const token = await getSpotifyAccessToken();
    const { data } = await axios.get(
      `https://api.spotify.com/v1/users/${SPOTIFY_USER_ID}/top/tracks?limit=5&time_range=short_term`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const tracks = data.items.map((track, i) =>
      `${i + 1}. ${track.name} - ${track.artists.map(a => a.name).join(', ')}`
    );
    res.setHeader('Content-Type', 'text/plain');
    res.send(tracks.join('\n'));
  } catch (e) {
    res.status(500).send('Error fetching top tracks: ' + e.message);
  }
});

app.get('/', (req, res) => {
  res.send('Spotify Top Tracks API is running. Use /top-tracks');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
