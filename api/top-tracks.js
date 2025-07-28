
import axios from 'axios';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
} = process.env;

async function getAccessToken() {
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return resp.data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  try {
    const token = await getAccessToken();
    const { data } = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term',
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
}
