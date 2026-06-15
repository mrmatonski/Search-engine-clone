import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the Moogle search page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /moogle/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /moogle search/i })).toBeInTheDocument();
});

test('uses real destinations for Gmail and Images links', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /gmail/i })).toHaveAttribute(
    'href',
    'https://www.gmail.com',
  );
  expect(screen.getByRole('link', { name: /images/i })).toHaveAttribute(
    'href',
    'https://www.google.com/imghp',
  );
});

test('prompts for search credentials when in-app search is not configured', async () => {
  render(<App />);
  const searchInput = screen.getByLabelText(/search/i);
  await userEvent.type(searchInput, 'portfolio projects');
  await userEvent.click(screen.getByRole('button', { name: /moogle search/i }));
  expect(screen.getByText(/connect moogle to real web search/i)).toBeInTheDocument();
  expect(screen.getByText(/react_app_google_search_api_key/i)).toBeInTheDocument();
});

test('renders real web results from the search API', async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
  const originalEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;

  process.env.REACT_APP_GOOGLE_SEARCH_API_KEY = 'test-key';
  process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID = 'test-cx';
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              cacheId: 'one',
              displayLink: 'example.com',
              link: 'https://example.com/result',
              snippet: 'A real result snippet from the web.',
              title: 'Example Search Result',
            },
          ],
        }),
    }),
  );

  render(<App />);
  await userEvent.type(screen.getByLabelText(/search/i), 'example');
  await userEvent.click(screen.getByRole('button', { name: /moogle search/i }));

  expect(await screen.findByText(/example search result/i)).toBeInTheDocument();
  expect(screen.getByText(/a real result snippet from the web/i)).toBeInTheDocument();

  if (originalApiKey === undefined) {
    delete process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
  } else {
    process.env.REACT_APP_GOOGLE_SEARCH_API_KEY = originalApiKey;
  }

  if (originalEngineId === undefined) {
    delete process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
  } else {
    process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID = originalEngineId;
  }

  global.fetch = originalFetch;
});

test('opens the demo sign in modal', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /demo sign in/i }));
  expect(screen.getByRole('dialog', { name: /demo sign in/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/you@gmail.com/i)).toBeInTheDocument();
});

test('shows the signed in account after submitting the modal', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /demo sign in/i }));
  await userEvent.type(screen.getByPlaceholderText(/you@gmail.com/i), 'michael@gmail.com');
  await userEvent.click(screen.getByRole('button', { name: /next/i }));
  expect(screen.getByRole('button', { name: /michael@gmail.com/i })).toBeInTheDocument();
});

test('opens the weather drawer from the bottom tab', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /what's the weather like/i }));
  expect(screen.getByLabelText(/local weather/i)).toBeInTheDocument();
});

test('loads weather from the user location', async () => {
  const originalGeolocation = navigator.geolocation;
  const originalFetch = global.fetch;

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (success) =>
        success({
          coords: {
            latitude: 34.05,
            longitude: -118.24,
          },
        }),
    },
  });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          timezone: 'America/Los_Angeles',
          current: {
            apparent_temperature: 70,
            is_day: 1,
            precipitation: 0,
            relative_humidity_2m: 55,
            temperature_2m: 72,
            weather_code: 0,
            wind_gusts_10m: 12,
            wind_speed_10m: 7,
          },
          daily: {
            precipitation_sum: [0.01],
            temperature_2m_max: [76],
            temperature_2m_min: [62],
          },
        }),
    }),
  );

  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /what's the weather like/i }));
  expect(await screen.findByText(/72°F/i)).toBeInTheDocument();
  expect(screen.getByText(/crystal clear/i)).toBeInTheDocument();

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation,
  });
  global.fetch = originalFetch;
});
