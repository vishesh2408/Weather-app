import React, { useEffect, useState, useCallback } from 'react';
// Core React Native components for UI
import { View, Text, StyleSheet, Switch, Image, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
// Specific React Native community packages
import { Picker } from '@react-native-picker/picker'; // For dropdowns
import * as Location from 'expo-location';
// For geolocation in Expo
import { API_KEY } from '@env';

// Define countries and cities for manual selection
const countries = [
    { label: "India", value: "IN" },
    { label: "USA", value: "US" },
    { label: "UK", value: "GB" },
];

const cities = {
    IN: [
        { label: "Delhi", value: "Delhi" },
        { label: "Mumbai", value: "Mumbai" },
        { label: "Bengaluru", value: "Bengaluru" },
        { label: "Kolkata", value: "Kolkata" },
    ],
    US: [
        { label: "New York", value: "New York" },
        { label: "Los Angeles", value: "Los Angeles" },
        { label: "Chicago", value: "Chicago" },
        { label: "Houston", value: "Houston" },
    ],
    GB: [
        { label: "London", value: "London" },
        { label: "Manchester", value: "Manchester" },
        { label: "Birmingham", value: "Birmingham" },
        { label: "Glasgow", value: "Glasgow" },
    ],
};

// Reusable PickerComponent for dropdowns (using React Native Picker)
const PickerComponent = ({ label, items, selectedValue, onValueChange }) => (
    <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Picker
            selectedValue={selectedValue}
            onValueChange={(itemValue) => onValueChange(itemValue)}
            style={styles.pickerSelect}
            // itemStyle can be used for text color on iOS, but usually not needed for Android
            // itemStyle={Platform.OS === 'ios' ? { color: styles.pickerSelect.color } : {}}
        >
            {items.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
        </Picker>
    </View>
);

const App = () => {
    const [useGPS, setUseGPS] = useState(true);
    const [locationGranted, setLocationGranted] = useState(false);
    const [country, setCountry] = useState("IN");
    const [city, setCity] = useState("Delhi");
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [unit, setUnit] = useState("metric"); // 'metric' for Celsius, 'imperial' for Fahrenheit
    const [error, setError] = useState(null);

    // Define image URLs based on weather conditions
    const getWeatherImage = (main) => {
        switch (main.toLowerCase()) {
            case "clear":
                return { uri: "https://png.pngtree.com/png-clipart/20220911/original/pngtree-cute-sunny-png-image_8544640.png" }; // Sunny
            case "clouds":
                return { uri: "https://cdn-icons-png.flaticon.com/512/6974/6974809.png" }; // Cloudy
            case "rain":
            case "drizzle":
                return { uri: "https://cdn-icons-png.flaticon.com/512/4851/4851967.png" }; // Rainy
            case "snow":
                return { uri: "https://th.bing.com/th/id/OIP.-k-ZVrJtPngxkBlrCO1egQHaEo?o=7rm=3&rs=1&pid=ImgDetMain&cb=idpwebp2&o=7&rm=3" }; // Snow
            case "thunderstorm":
                return { uri: "https://www.thoughtco.com/thmb/KempzxGFcb8FXt7JN2G43_CSqE8=/3600x2400/filters:fill(auto,1)/GettyImages-605383007-5728164c3df78ced1f3a2015.jpg" }; // Stormy
            case "mist":
            case "smoke":
            case "haze":
            case "dust":
            case "fog":
            case "sand":
            case "ash":
            case "squall":
            case "tornado":
                return { uri: "https://media.defense.gov/2022/Mar/25/2002963745/2000/2000/0/220325-F-VC621-1003.JPG" }; // Atmospheric conditions (Haze/Mist)
            default:
                return { uri: "https://cdn.dribbble.com/userupload/21040863/file/original-5df80116f10126e6ead9180d2cd29018.png?resize=400x300&vertical=center" }; // Default icon
        }
    };

    // Function to fetch weather data
    const fetchWeather = useCallback(async () => {
        setLoading(true);
        setError(null);
        // OpenWeatherMap API Key
        // API Key provided by the user
        const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

        if (!API_KEY || API_KEY.length < 30) {
            setError("Invalid API Key provided. Please ensure it's correct.");
            setLoading(false);
            return;
        }

        try {
            let url = "";

            if (useGPS) {
                // Request location permissions
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError("Location access denied. Please enable location services for this app or switch to manual selection.");
                    setLocationGranted(false);
                    setLoading(false);
                    return;
                }
                setLocationGranted(true);

                // Get current position
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`;
                await makeApiCall(url);

            } else {
                url = `${WEATHER_API_URL}?q=${city},${country}&appid=${API_KEY}&units=${unit}`;
                await makeApiCall(url);
            }
        } catch (err) {
            console.error("Weather fetch initiation error:", err);
            setError("Failed to initiate weather data fetch. Please try again.");
            setLoading(false);
        }
    }, [useGPS, city, country, unit]);

    // Helper function to make the actual API call
    const makeApiCall = async (url) => {
        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.cod === 200) {
                setWeatherData(data);
            } else {
                setWeatherData(null);
                let errorMessage = data.message || "Unable to load weather data. Please check the city/country or try again.";
                if (data.message && data.message.includes("city not found")) {
                    errorMessage = "City Not Found: The selected city/country combination could not be found. Please try another.";
                } else if (data.cod === 401) {
                    errorMessage = "Invalid API Key. Please double-check your OpenWeatherMap API key.";
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Weather API call error:", err);
            setError("Failed to fetch weather data. Please check your internet connection or try again.");
        } finally {
            setLoading(false);
        }
    };

    // Effect for handling initial GPS permission request and fetching weather
    useEffect(() => {
        fetchWeather();
    }, [useGPS, fetchWeather]);

    // Effect for manual city/country changes
    useEffect(() => {
        if (!useGPS && city && country) {
            fetchWeather();
        }
    }, [city, country, useGPS, fetchWeather]);

    // Function to convert Celsius to Fahrenheit
    const toFahrenheit = (celsius) => (celsius * 9 / 5) + 32;

    const displayTemperature = weatherData?.main?.temp ?
        (unit === 'metric' ?
            `${Math.round(weatherData.main.temp)}°C` :
            `${Math.round(toFahrenheit(weatherData.main.temp))}°F`)
        : 'N/A';

    return (
        // Using ScrollView to make the content scrollable
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.appContainer}>
                <View style={styles.mainContentWrapper}>
                    <Text style={styles.appHeading}>
                        <Text style={{ color: '#F7DC6F' }}>☀️</Text> Weather App
                    </Text>

                    <View style={styles.switchWrapper}>
                        <Text style={styles.switchLabel}>Use GPS Location</Text>
                        <Switch
                            onValueChange={() => setUseGPS(!useGPS)}
                            value={useGPS}
                            trackColor={{ false: styles.switchSlider.backgroundColor, true: styles.switchInputCheckedColor }}
                            thumbColor={styles.switchSliderBefore.backgroundColor}
                            ios_backgroundColor={styles.switchSlider.backgroundColor} // For iOS background
                        />
                    </View>

                    {!useGPS && (
                        <View style={styles.pickerGroup}>
                            <PickerComponent
                                label="Select Country"
                                items={countries}
                                selectedValue={country}
                                onValueChange={(val) => {
                                    setCountry(val);
                                    if (cities[val] && cities[val].length > 0) {
                                        setCity(cities[val][0].value);
                                    } else {
                                        setCity("");
                                    }
                                }}
                            />
                            <PickerComponent
                                label="Select City"
                                items={cities[country] || []}
                                selectedValue={city}
                                onValueChange={setCity}
                            />
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.loadingIndicatorContainer}>
                            <ActivityIndicator size="large" color={styles.spinner.borderLeftColor} />
                            <Text style={styles.loadingText}>Loading Weather...</Text>
                        </View>
                    ) : weatherData ? (
                        <View style={styles.weatherCard}>
                            <Image
                                source={getWeatherImage(weatherData.weather[0].main)}
                                style={styles.weatherIcon}
                                resizeMode="contain" // Ensures the image fits within bounds
                            />
                            <Text style={styles.temperature}>
                                {displayTemperature}
                            </Text>
                            <Text style={styles.description}>
                                {weatherData.weather[0].description}
                            </Text>
                            <Text style={styles.location}>
                                {weatherData.name}, {weatherData.sys.country}
                            </Text>
                            <Text style={styles.coordinates}>
                                Lat: {weatherData.coord.lat.toFixed(2)}, Lon: {weatherData.coord.lon.toFixed(2)}
                            </Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    onPress={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
                                    style={styles.switchUnitButton}
                                >
                                    <Text style={styles.switchUnitButtonText}>
                                        Switch to {unit === 'metric' ? 'Fahrenheit' : 'Celsius'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.errorCard}>
                            <Text style={styles.errorTitle}>Oops!</Text>
                            <Text style={styles.errorMessage}>{error || "Unable to load weather data. Please try again."}</Text>
                            {!useGPS && (
                                <Text style={styles.errorMessageSmall}>Make sure your city/country selection is valid.</Text>
                            )}
                            {useGPS && !locationGranted && (
                                <Text style={styles.errorMessageSmall}>Please grant location permission to use GPS.</Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

// React Native Styles
const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1, // Allows the content to grow and enable scrolling
        justifyContent: 'center', // Centers content vertically if it doesn't fill the screen
        alignItems: 'center', // Centers content horizontally
        backgroundColor: '#e0f7fa', // Background for the scroll view area
    },
    appContainer: {
        width: '100%',
        minHeight: Platform.OS === 'web' ? '100vh' : '100%', // Use 100vh for web, 100% for native to fill parent ScrollView
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#e0f7fa', // Fallback color, gradients require external libs
    },
    mainContentWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 500, // max-width is typically handled by parent container's flex/width
        paddingVertical: 24,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10, // For Android shadow
    },
    appHeading: {
        fontSize: 40,
        fontWeight: '800',
        marginBottom: 28,
        marginTop: 50, // Added top margin
        color: '#004d80',
        textAlign: 'center',
        lineHeight: 48,
        letterSpacing: -0.5,
    },
    switchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 24,
        backgroundColor: '#f0f8ff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#cceeff',
        marginBottom: 20,
    },
    switchLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 15,
        color: '#333',
    },
    switchSlider: { // Reference for trackColor
        backgroundColor: '#d1d5db',
    },
    switchInputCheckedColor: { // Reference for trackColor
        backgroundColor: '#4CAF50',
    },
    switchSliderBefore: { // Reference for thumbColor
        backgroundColor: 'white',
    },
    pickerGroup: {
        width: '100%',
        marginBottom: 12,
    },
    pickerContainer: {
        marginBottom: 15,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    pickerLabel: {
        fontSize: 15,
        color: '#555',
        fontWeight: '500',
        marginBottom: 6,
        paddingLeft: 5,
    },
    pickerSelect: {
        width: '100%',
        height: Platform.OS === 'ios' ? 120 : 45, // iOS Picker needs a larger height to show items
        color: '#1f2937',
        backgroundColor: '#f9f9f9',
        borderWidth: 1, // Only for Android to simulate border-radius
        borderColor: '#ccc',
        borderRadius: 12, // For Android picker
    },
    loadingIndicatorContainer: {
        marginTop: 40,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
    },
    spinner: {
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderLeftColor: '#4CAF50',
        borderTopColor: '#4CAF50',
        borderRadius: 50,
        width: 70,
        height: 70,
    },
    loadingText: {
        fontSize: 21,
        color: '#4CAF50',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    weatherCard: {
        backgroundColor: '#1976D2', // Solid blue as a fallback
        color: '#fff',
        padding: 30,
        borderRadius: 40,
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 30,
        width: '100%',
        maxWidth: 480,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.25,
        shadowRadius: 50,
        elevation: 15,
        overflow: 'hidden',
    },
    weatherIcon: {
        width: 120,
        height: 120,
        marginBottom: 15,
    },
    temperature: {
        fontSize: 72,
        fontWeight: '700',
        marginBottom: 8,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 5,
    },
    description: {
        fontSize: 29,
        textTransform: 'capitalize',
        marginBottom: 10,
        fontWeight: '500',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    location: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    coordinates: {
        fontSize: 14.4,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 5,
        letterSpacing: 0.5,
    },
    buttonContainer: {
        marginTop: 30,
    },
    switchUnitButton: {
        backgroundColor: '#FF5722',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    switchUnitButtonText: {
        color: '#fff',
        fontSize: 17.6,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    errorCard: {
        backgroundColor: '#ffcdd2',
        color: '#b71c1c',
        padding: 25,
        borderRadius: 20,
        width: '100%',
        maxWidth: 380,
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#ef9a9a',
    },
    errorTitle: {
        color: '#c62828',
        fontSize: 22.4,
        fontWeight: '700',
        marginBottom: 8,
    },
    errorMessage: {
        color: '#b71c1c',
        fontSize: 17.6,
        textAlign: 'center',
        marginBottom: 5,
    },
    errorMessageSmall: {
        color: '#b71c1c',
        fontSize: 13.6,
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
        opacity: 0.9,
    },
});

export default App;
