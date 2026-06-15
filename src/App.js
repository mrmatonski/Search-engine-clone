import { useEffect, useState } from 'react';
import './App.css';

const weatherCodes = {
  0: ['Crystal clear', '☀'],
  1: ['Mostly clear', '🌤'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁'],
  45: ['Fog rolling in', '🌫'],
  48: ['Rime fog', '🌫'],
  51: ['Light drizzle', '🌦'],
  53: ['Drizzle', '🌦'],
  55: ['Heavy drizzle', '🌧'],
  61: ['Light rain', '🌧'],
  63: ['Rain', '🌧'],
  65: ['Heavy rain', '⛈'],
  71: ['Light snow', '❄'],
  73: ['Snow', '❄'],
  75: ['Heavy snow', '❄'],
  80: ['Passing showers', '🌦'],
  81: ['Showers', '🌧'],
  82: ['Violent showers', '⛈'],
  95: ['Thunderstorm', '⛈'],
  96: ['Storm with hail', '⛈'],
  99: ['Heavy hailstorm', '⛈'],
};

const getWeatherMood = (code, isDay) => {
  const [label, icon] = weatherCodes[code] || ['Atmospheric mystery', isDay ? '☀' : '☾'];
  return { icon, label };
};

function App() {
  const [query, setQuery] = useState('');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [signedInEmail, setSignedInEmail] = useState('');
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [weatherError, setWeatherError] = useState('');
  const [weather, setWeather] = useState(null);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeQuery, setActiveQuery] = useState('');

  const isSignedIn = signedInEmail.length > 0;
  const hasSearchResults = searchResults.length > 0 || searchStatus !== 'idle';

  const searchOnGoogle = (term, lucky = false) => {
    const params = new URLSearchParams({ q: term || 'Moogle' });

    if (lucky) {
      params.set('btnI', '1');
    }

    window.location.assign(`https://www.google.com/search?${params}`);
  };

  const runWebSearch = async (event) => {
    event.preventDefault();
    const searchTerm = query.trim();

    if (!searchTerm) {
      return;
    }

    setActiveQuery(searchTerm);
    setSearchResults([]);
    setSearchError('');

    const googleSearchApiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const googleSearchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;

    if (!googleSearchApiKey || !googleSearchEngineId) {
      setSearchStatus('missing-config');
      return;
    }

    setSearchStatus('loading');

    try {
      const params = new URLSearchParams({
        key: googleSearchApiKey,
        cx: googleSearchEngineId,
        q: searchTerm,
      });
      const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);

      if (!response.ok) {
        throw new Error('Search request failed.');
      }

      const data = await response.json();
      setSearchResults(data.items || []);
      setSearchStatus('success');
    } catch {
      setSearchStatus('error');
      setSearchError('Moogle could not load web results. You can still search on Google.');
    }
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    setSignedInEmail(email.trim() || 'moogler@gmail.com');
    setIsSignInOpen(false);
  };

  const loadWeather = () => {
    setWeatherStatus('loading');
    setWeatherError('');

    if (!navigator.geolocation) {
      setWeatherStatus('error');
      setWeatherError('Location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            latitude: coords.latitude.toFixed(4),
            longitude: coords.longitude.toFixed(4),
            current:
              'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
            temperature_unit: 'fahrenheit',
            wind_speed_unit: 'mph',
            precipitation_unit: 'inch',
            timezone: 'auto',
            forecast_days: '1',
          });
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

          if (!response.ok) {
            throw new Error('Weather request failed.');
          }

          const data = await response.json();
          const mood = getWeatherMood(data.current.weather_code, data.current.is_day);

          setWeather({
            coords,
            current: data.current,
            daily: data.daily,
            mood,
            timezone: data.timezone,
          });
          setWeatherStatus('success');
        } catch {
          setWeatherStatus('error');
          setWeatherError('Could not pull weather data right now. Try again in a moment.');
        }
      },
      () => {
        setWeatherStatus('error');
        setWeatherError('Location permission is needed to show local weather.');
      },
      { enableHighAccuracy: false, maximumAge: 600000, timeout: 10000 },
    );
  };

  const openWeatherPanel = () => {
    setIsWeatherOpen(true);

    if (weatherStatus === 'idle') {
      loadWeather();
    }
  };

  useEffect(() => {
    if (!isSignInOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSignInOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignInOpen]);

  return (
    <main className="app">
      <header className="top-nav" aria-label="Moogle navigation">
        <a href="https://about.google">About</a>
        <a href="https://store.google.com">Store</a>
        <span className="nav-spacer" />
        <a href="https://www.gmail.com">Gmail</a>
        <a href="https://www.google.com/imghp">Images</a>
        <button className="apps-button" aria-label="Moogle apps" type="button">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </button>
        {isSignedIn ? (
          <button
            className="profile-button"
            onClick={() => setIsSignInOpen(true)}
            type="button"
          >
            <span>{signedInEmail.charAt(0).toUpperCase()}</span>
            {signedInEmail}
          </button>
        ) : (
          <button
            className="sign-in-button"
            onClick={() => setIsSignInOpen(true)}
            type="button"
          >
            Demo sign in
          </button>
        )}
      </header>

      <section className="search-panel" aria-labelledby="moogle-title">
        <h1 id="moogle-title" className="logo" aria-label="Moogle">
          <span className="logo-blue">M</span>
          <span className="logo-red">o</span>
          <span className="logo-yellow">o</span>
          <span className="logo-blue">g</span>
          <span className="logo-green">l</span>
          <span className="logo-red">e</span>
        </h1>

        <form className="search-form" onSubmit={runWebSearch}>
          <label className="search-box">
            <span className="search-icon" aria-hidden="true" />
            <input
              aria-label="Search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Moogle or type a URL"
              type="search"
              value={query}
            />
            <span className="voice-icon" aria-hidden="true" />
          </label>

          <div className="search-actions">
            <button type="submit">Moogle Search</button>
            <button
              onClick={() => searchOnGoogle(query.trim() || 'Moogle', true)}
              type="button"
            >
              I'm Feeling Lucky
            </button>
          </div>
        </form>
      </section>

      {hasSearchResults && (
        <section className="results-section" aria-label="Search results">
          <div className="result-tabs" aria-label="Search filters">
            <button className="active" type="button">All</button>
            <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(activeQuery)}`}>
              Images
            </a>
            <a href={`https://news.google.com/search?q=${encodeURIComponent(activeQuery)}`}>
              News
            </a>
            <a href={`https://www.google.com/search?tbm=vid&q=${encodeURIComponent(activeQuery)}`}>
              Videos
            </a>
            <a href={`https://www.google.com/maps/search/${encodeURIComponent(activeQuery)}`}>
              Maps
            </a>
          </div>

          {searchStatus === 'loading' && (
            <div className="search-state">
              <span className="search-spinner" />
              <p>Searching the web for <strong>{activeQuery}</strong>...</p>
            </div>
          )}

          {searchStatus === 'missing-config' && (
            <div className="search-state setup-state">
              <h2>Connect Moogle to real web search</h2>
              <p>
                Add your Google Programmable Search credentials to use real in-app
                results. Until then, Moogle can hand the query to Google.
              </p>
              <code>REACT_APP_GOOGLE_SEARCH_API_KEY</code>
              <code>REACT_APP_GOOGLE_SEARCH_ENGINE_ID</code>
              <button onClick={() => searchOnGoogle(activeQuery)} type="button">
                Search on Google
              </button>
            </div>
          )}

          {searchStatus === 'error' && (
            <div className="search-state setup-state">
              <h2>Search hit turbulence</h2>
              <p>{searchError}</p>
              <button onClick={() => searchOnGoogle(activeQuery)} type="button">
                Search on Google
              </button>
            </div>
          )}

          {searchStatus === 'success' && (
            <>
              <p className="result-count">
                Showing real web results for <strong>{activeQuery}</strong>
              </p>

              <div className="results-list">
                {searchResults.map((result) => (
                  <article className="result-card" key={result.cacheId || result.link}>
                    <cite>{result.displayLink || result.link}</cite>
                    <h2>
                      <a href={result.link}>{result.title}</a>
                    </h2>
                    <p>{result.snippet}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <footer className="footer">
        <a href="https://ads.google.com">Advertising</a>
        <a href="https://www.google.com/services">Business</a>
        <a href="https://policies.google.com/privacy">Privacy</a>
        <a href="https://policies.google.com/terms">Terms</a>
      </footer>

      <button className="weather-tab" onClick={openWeatherPanel} type="button">
        <span className="weather-tab-icon" aria-hidden="true">☁</span>
        What's the weather like?
      </button>

      {isSignInOpen && (
        <div
          aria-labelledby="sign-in-title"
          aria-modal="true"
          className="modal-backdrop"
          onClick={() => setIsSignInOpen(false)}
          role="dialog"
        >
          <section className="sign-in-modal" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Close sign in"
              className="close-button"
              onClick={() => setIsSignInOpen(false)}
              type="button"
            >
              x
            </button>

            <div className="modal-logo" aria-label="Moogle">
              <span className="logo-blue">M</span>
              <span className="logo-red">o</span>
              <span className="logo-yellow">o</span>
              <span className="logo-blue">g</span>
              <span className="logo-green">l</span>
              <span className="logo-red">e</span>
            </div>

            <h2 id="sign-in-title">Demo sign in</h2>
            <p>Preview a Google-style account flow without sending credentials.</p>

            <form className="modal-form" onSubmit={handleSignIn}>
              <label>
                <span>Email or phone</span>
                <input
                  autoFocus
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@gmail.com"
                  type="email"
                  value={email}
                />
              </label>

              <a href="#forgot-email">Forgot email?</a>

              <p className="modal-note">
                Portfolio demo only. This stores the email locally in React state and does
                not authenticate with Google.
              </p>

              <div className="modal-actions">
                <button className="text-button" type="button">
                  Create account
                </button>
                <button className="next-button" type="submit">
                  Next
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isWeatherOpen && (
        <aside className="weather-drawer" aria-label="Local weather">
          <button
            aria-label="Close weather"
            className="weather-close"
            onClick={() => setIsWeatherOpen(false)}
            type="button"
          >
            x
          </button>

          <div className="weather-orb" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="weather-content">
            <p className="weather-kicker">Live from your sky</p>
            <h2>What's the weather like?</h2>

            {weatherStatus === 'loading' && (
              <div className="weather-loading">
                <span />
                <p>Finding your location and tuning into the forecast...</p>
              </div>
            )}

            {weatherStatus === 'error' && (
              <div className="weather-error">
                <p>{weatherError}</p>
                <button onClick={loadWeather} type="button">Try again</button>
              </div>
            )}

            {weatherStatus === 'success' && weather && (
              <div className="weather-report">
                <div className="weather-hero">
                  <span className="weather-emoji" aria-hidden="true">
                    {weather.mood.icon}
                  </span>
                  <div>
                    <strong>{Math.round(weather.current.temperature_2m)}°F</strong>
                    <p>{weather.mood.label}</p>
                  </div>
                </div>

                <div className="weather-stats">
                  <article>
                    <span>Feels like</span>
                    <strong>{Math.round(weather.current.apparent_temperature)}°F</strong>
                  </article>
                  <article>
                    <span>Humidity</span>
                    <strong>{weather.current.relative_humidity_2m}%</strong>
                  </article>
                  <article>
                    <span>Wind</span>
                    <strong>{Math.round(weather.current.wind_speed_10m)} mph</strong>
                  </article>
                  <article>
                    <span>Rain today</span>
                    <strong>{weather.daily.precipitation_sum[0].toFixed(2)} in</strong>
                  </article>
                </div>

                <p className="weather-location">
                  {weather.timezone} · {weather.coords.latitude.toFixed(2)},
                  {' '}
                  {weather.coords.longitude.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}

export default App;
