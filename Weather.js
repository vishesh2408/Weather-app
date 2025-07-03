// Weather.js

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { styles } from './styles';
import { getWeather, getForecast } from './api';

const Weather = () => {
	const [city, setCity] = useState("");
	const [weatherData, setWeatherData] = useState(null);
	const [forecastData, setForecastData] = useState(null);

	const handleGetWeather = () => {
		getWeather(city, setWeatherData, setForecastData);
	};

	const handleGetForecast = () => {
		getForecast(city, setWeatherData, setForecastData);
	};

	return (
		<View style={styles.centeredContent}>
			<Text style={styles.title}>GeeksForGeeks</Text>
			<Text style={styles.title}>Weather App</Text>
			<TextInput
				style={styles.input}
				placeholder="Enter city name"
				value={city}
				onChangeText={setCity}
			/>

			<Pressable
				onPress={handleGetWeather}
				style={({ pressed }) => [
					styles.button,
					{
						backgroundColor: pressed ? '#1e8449' : '#2ecc71',
					},
				]}
			>
				<Text style={styles.buttonText}>Get Weather</Text>
			</Pressable>
			<Text> </Text>
			<Pressable
				onPress={handleGetForecast}
				style={({ pressed }) => [
					styles.button,
					{
						backgroundColor: pressed ? '#1e8449' : '#2ecc71',
					},
				]}
			>
				<Text style={styles.buttonText}>Get Forecast</Text>
			</Pressable>

			{weatherData && (
				<View style={styles.weatherInfo}>
					<Text style={styles.weatherText}>
						<Text style={styles.heading}>
							Temperature:
						</Text> {weatherData.temperature} °C
					</Text>
					<Text style={styles.weatherText}>
						<Text style={styles.heading}>
							Description:
						</Text> {weatherData.description}
					</Text>
				</View>
			)}

			{forecastData && (
				<View style={styles.weatherInfo}>
					<Text style={styles.heading}>
						Forecast for the next few hours: {'\n'}
					</Text>
					{forecastData.map((forecastItem, index) => (
						<Text key={index} style={styles.weatherText}>
							<Text style={styles.subheading}>Time:</Text>{' '}
							{new Date(forecastItem.dt * 1000).toLocaleTimeString()},{' '}
							<Text style={styles.subheading}>Temperature:</Text>{' '}
							{(forecastItem.main.temp - 273.15).toFixed(2)} °C,{' '}
							<Text style={styles.subheading}>Description:</Text>{' '}
							{forecastItem.weather[0].description}
						</Text>
					))}
				</View>
			)}
		</View>
	);
};

export default Weather;