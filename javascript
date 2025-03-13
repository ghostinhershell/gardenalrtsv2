// Import required libraries
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

// Get environment variables (API keys, GitHub token, repository details)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const LOCATION_KEY = process.env.LOCATION_KEY; // Location key for AccuWeather API

// Initialize Octokit with GitHub token for authentication
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Function to fetch weather forecast from AccuWeather API
async function fetchWeatherForecast() {
  try {
    const response = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${LOCATION_KEY}`, {
      params: { apikey: ACCUWEATHER_API_KEY }
    });
    return response.data.DailyForecasts;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

// Function to analyze weather forecast for garden-relevant conditions
function analyzeGardenConditions(forecasts) {
  const alerts = [];

  forecasts.forEach(forecast => {
    const date = forecast.Date;
    const minTemp = forecast.Temperature.Minimum.Value;
    const maxTemp = forecast.Temperature.Maximum.Value;
    const rain = forecast.Day.Rain.Value + forecast.Night.Rain.Value;

    if (minTemp < 32) {
      alerts.push(`Frost risk on ${date}. Minimum temperature: ${minTemp}°F`);
    }
    if (maxTemp > 95) {
      alerts.push(`Heat stress warning on ${date}. Maximum temperature: ${maxTemp}°F`);
    }
    if (rain > 1) {
      alerts.push(`Heavy rain warning on ${date}. Total rainfall: ${rain} inches`);
    }
    if (rain === 0) {
      alerts.push(`Drought warning on ${date}. No rainfall expected`);
    }
  });

  return alerts;
}

// Function to create GitHub issue with garden alerts
async function createGitHubIssue(alerts) {
  const title = 'Garden Alert: Weather Conditions';
  const body = alerts.join('\n');

  try {
    await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      body
    });
    console.log('GitHub issue created successfully.');
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    throw error;
  }
}

// Main function to run the entire process
async function main() {
  try {
    const forecasts = await fetchWeatherForecast();
    const alerts = analyzeGardenConditions(forecasts);

    if (alerts.length > 0) {
      await createGitHubIssue(alerts);
    } else {
      console.log('No garden alerts for the upcoming days.');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function to execute the script
main();
