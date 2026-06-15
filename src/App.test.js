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

test('submits searches to Google like the real search page', () => {
  render(<App />);
  const searchInput = screen.getByLabelText(/search/i);
  const searchForm = searchInput.closest('form');

  expect(searchForm).toHaveAttribute('action', 'https://www.google.com/search');
  expect(searchForm).toHaveAttribute('method', 'GET');
  expect(searchInput).toHaveAttribute('name', 'q');
  expect(screen.getByRole('button', { name: /i'm feeling lucky/i })).toHaveAttribute(
    'name',
    'btnI',
  );
});

test('opens the sign in modal', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/you@gmail.com/i)).toBeInTheDocument();
});

test('shows the signed in account after submitting the modal', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
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
