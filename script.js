let unit = "celsius";
let liveInterval;

const input = document.getElementById("searchInput");

// DOM
const weather = document.getElementById("weather");
const city = document.getElementById("city");
const temp = document.getElementById("temp");
const desc = document.getElementById("desc");
const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const dateTime = document.getElementById("dateTime");
const forecast = document.getElementById("forecast");
const alertBox = document.getElementById("alert");
const error = document.getElementById("error");
const loader = document.getElementById("loader");
const chart = document.getElementById("chart");

const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");

/* EVENTS */
document.getElementById("searchBtn").onclick = () => search(input.value);

document.getElementById("unitToggle").onclick = () => {
  unit = unit === "celsius" ? "fahrenheit" : "celsius";
  search(input.value);
};

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

/* SEARCH */
async function search(cityName) {
  if (!cityName) return showError("Enter city");

  showLoader(true);

  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}`,
    ).then((r) => r.json());

    if (!geo.results) throw new Error("City not found");

    const { latitude, longitude, name, country } = geo.results[0];

    await getWeather(latitude, longitude, name, country);

    startLive(latitude, longitude, name, country);
  } catch (e) {
    showError(e.message);
  }

  showLoader(false);
}

/* WEATHER */
async function getWeather(lat, lon, name, country) {
  const data = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,pressure_msl,visibility&daily=temperature_2m_max,sunrise,sunset&timezone=auto`,
  ).then((r) => r.json());

  render(name, country, data);
}

/* RENDER */
function render(name, country, d) {
  weather.classList.remove("hidden");

  city.innerText = `${name}, ${country}`;
  dateTime.innerText = new Date().toLocaleString();

  // 🌡 MAIN WEATHER
  temp.innerText = convert(d.current.temperature_2m) + "°";
  desc.innerText = "Live Weather";

  // 🌬 EXTRA DATA
  wind.innerText = "Wind: " + d.current.wind_speed_10m + " km/h";
  humidity.innerText = "Humidity: " + d.current.relative_humidity_2m + "%";

  document.getElementById("feels").innerText =
    convert(d.current.apparent_temperature) + "°";

  // 🌅 SUN DATA
  sunriseEl.innerText = formatTime(d.daily.sunrise[0]);
  sunsetEl.innerText = formatTime(d.daily.sunset[0]);

  // 📅 FORECAST
  forecast.innerHTML = d.daily.time
    .slice(0, 7)
    .map(
      (t, i) => `
    <div>
      <p>${t}</p>
      <p>${convert(d.daily.temperature_2m_max[i])}°</p>
    </div>
  `,
    )
    .join("");

  drawChart(d.daily.temperature_2m_max.slice(0, 7));

  showAlert("Live Weather Updated ✔");

  autoTheme(d.daily.sunrise[0], d.daily.sunset[0]);

  document.getElementById("pressure").innerText =
    d.current.pressure_msl + " hPa";

  document.getElementById("visibility").innerText =
    (d.current.visibility / 1000).toFixed(1) + " km";
}

/* LIVE SYSTEM */
function startLive(lat, lon, name, country) {
  if (liveInterval) clearInterval(liveInterval);

  liveInterval = setInterval(() => {
    getWeather(lat, lon, name, country);
  }, 300000); // 5 min
}

/* AUTO THEME */
function autoTheme(sunrise, sunset) {
  const now = new Date().getHours();
  const rise = new Date(sunrise).getHours();
  const set = new Date(sunset).getHours();

  if (now >= rise && now < set) {
    document.body.classList.remove("dark");
  } else {
    document.body.classList.add("dark");
  }
}

/* TEMP */
function convert(t) {
  return unit === "fahrenheit" ? ((t * 9) / 5 + 32).toFixed(1) : t;
}

/* CHART */
function drawChart(data) {
  const ctx = chart.getContext("2d");
  ctx.clearRect(0, 0, 300, 80);

  const max = Math.max(...data);
  const min = Math.min(...data);

  ctx.beginPath();
  ctx.moveTo(10, 80);

  data.forEach((v, i) => {
    const x = i * 50 + 10;
    const y = 80 - ((v - min) / (max - min || 1)) * 70;
    ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

/* HELPERS */
function formatTime(d) {
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showLoader(s) {
  loader.classList.toggle("hidden", !s);
}

function showError(m) {
  error.innerText = m;
}

function showAlert(m) {
  alertBox.innerText = m;
}
