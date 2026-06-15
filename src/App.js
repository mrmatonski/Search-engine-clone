import { useEffect, useMemo, useState } from 'react';
import './App.css';

const results = [
  {
    title: 'Moogle Search - Find What Matters',
    url: 'https://www.moogle.example/search',
    snippet:
      'A friendly search experience for discovering pages, ideas, images, maps, and the occasional suspiciously useful answer.',
  },
  {
    title: 'React Search Interface Patterns',
    url: 'https://developer.example/react-search',
    snippet:
      'Build approachable search pages with controlled inputs, responsive layouts, and clear result summaries.',
  },
  {
    title: 'How Search Engines Rank Pages',
    url: 'https://learn.example/search-ranking',
    snippet:
      'An overview of keywords, freshness, links, structure, and relevance signals that help people find the right page.',
  },
  {
    title: 'Images, News, Maps, Shopping - Moogle',
    url: 'https://www.moogle.example/features',
    snippet:
      'Jump between different kinds of results with tabs inspired by familiar search tools and everyday browsing habits.',
  },
];

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
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [signedInEmail, setSignedInEmail] = useState('');
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [weatherError, setWeatherError] = useState('');
  const [weather, setWeather] = useState(null);

  const hasSearched = submittedQuery.trim().length > 0;
  const isSignedIn = signedInEmail.length > 0;

  const filteredResults = useMemo(() => {
    if (!hasSearched) {
      return results;
    }

    return results.map((result) => ({
      ...result,
      snippet: result.snippet.replace(
        /search|pages|results/gi,
        (match) => `${match}`,
      ),
    }));
  }, [hasSearched]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedQuery(query.trim() || 'Moogle');
  };

  const handleLuckySearch = () => {
    setQuery('Moogle magic');
    setSubmittedQuery('Moogle magic');
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
    <main className={hasSearched ? 'app results-mode' : 'app'}>
      <header className="top-nav" aria-label="Moogle navigation">
        <a href="#about">About</a>
        <a href="#store">Store</a>
        <span className="nav-spacer" />
        <a href="#mail">Gmail</a>
        <a href="#images">Images</a>
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
            Sign in
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

        <form className="search-form" onSubmit={handleSubmit}>
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
            <button onClick={handleLuckySearch} type="button">
              I'm Feeling Lucky
            </button>
          </div>
        </form>
      </section>

      {hasSearched && (
        <section className="results-section" aria-label="Search results">
          <div className="result-tabs" aria-label="Search filters">
            <button className="active" type="button">All</button>
            <button type="button">Images</button>
            <button type="button">News</button>
            <button type="button">Videos</button>
            <button type="button">Maps</button>
          </div>

          <p className="result-count">
            About 42,000,000 results for <strong>{submittedQuery}</strong>
          </p>

          <div className="results-list">
            {filteredResults.map((result) => (
              <article className="result-card" key={result.title}>
                <cite>{result.url}</cite>
                <h2>
                  <a href={result.url}>{result.title}</a>
                </h2>
                <p>{result.snippet}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!hasSearched && (
        <footer className="footer">
          <a href="#advertising">Advertising</a>
          <a href="#business">Business</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </footer>
      )}

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

            <h2 id="sign-in-title">Sign in</h2>
            <p>Use your Google Account to continue to Moogle.</p>

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
                This demo signs you in locally. Real Google sign-in needs OAuth credentials.
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
