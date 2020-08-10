import React from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBBtn, MDBIcon } from 'mdbreact';
import { format } from 'date-fns';
import './App.css';

/* -------------------------------- Component ------------------------------- */
import WeatherCard from './pages/components/WeatherCard';

/* ---------------------------- support libraries --------------------------- */
const _ = require('lodash');
const axios = require('axios');

const URL_GET_CURRENT_CONDITION_ACCUWEATHER =
    'http://dataservice.accuweather.com/currentconditions/v1/';

const URL_GET_LOCATION_INFO_ACCUWEATHER =
    'http://dataservice.accuweather.com/locations/v1/cities/geoposition/search';

const URL_GET_5_DAYS_FORECASTS_ACCUWEATHER =
    'http://dataservice.accuweather.com/forecasts/v1/daily/5day/';

class App extends React.Component {
    state = {
        currentTime: '',
        isAM: true,
        date: '',
        location: {
            lat: '',
            long: '',
            city: '',
            state: '',
            locationKey: '',
        },
        weather: [],
        currentCondition: {},
        error: '',
    };

    // NOTE: componentDidMount will run immediately after a component is mounted
    // It means it will set state right away compenent created
    componentDidMount() {
        // this.setState({
        //     date: format(new Date(), 'MMMM, dd yyyy'),
        // });
        // // set time in here clock here
        // setInterval(() => {
        //     this.setTime();
        // }, 1000);
        // this.setLocation(this.setWeatherAndLocation);
    }

    setLocation = (callback) => {
        this.getLocation(function (object) {
            const { latitude, longitude } = object;
            callback(latitude, longitude);
        });
    };
    setTime = () => {
        const currentTime = new Date();
        this.setState({
            currentTime: format(currentTime, 'hh:mm:ss'),
            isAM: format(currentTime, 'a') === 'AM' ? true : false,
        });
    };

    getLocation = (callback) => {
        if ('geolocation' in navigator) {
            /* geolocation is available */
            window.navigator.geolocation.getCurrentPosition(
                //* Try to get lat and long from GeolocationAPI

                /* -------------------------- First method: Success ------------------------- */
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    callback({
                        latitude: latitude,
                        longitude: longitude,
                    });
                },
                /* ######################### END  First method: Success######################## */

                //* Try to get lat and long from ipData API if GeolocationAPI not working
                /* -------------------------- Second method: error -------------------------- */
                async (error) => {
                    if (error.code === 1) {
                        console.log('will it come hre');
                        const response = await this.getCurrentPositionFromIPDATA();
                        if (response) {
                            const { latitude, longitude } = response;
                            return {
                                latitude: latitude,
                                longitude: longitude,
                            };
                        }
                        this.setState({
                            error,
                        });
                    }
                },
                /* ###################END  Second method: error ######################## */
            );
        } else {
            /* geolocation IS NOT available */
            this.setState({
                error: 'geolocation IS NOT available',
            });
        }
    };

    getLocationFromLatAndLong = async (lat, long) => {
        const qValue = `${lat},${long}`;
        const cachedLocation = localStorage.getItem('');
        try {
            const response = await axios.get(
                'http://dataservice.accuweather.com/locations/v1/cities/geoposition/search',
                {
                    params: {
                        apikey: 'qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ',
                        q: qValue,
                    },
                },
            );

            const locationKey = response.data.Key;

            this.setState({
                location: {
                    lat,
                    long,
                    city: response.data.LocalizedName,
                    state: response.data.AdministrativeArea.LocalizedName,
                    locationKey: locationKey,
                },
            });
            const responseWeather = await axios.get(
                `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}`,
                {
                    params: {
                        apikey: 'qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ',
                    },
                },
            );
            console.log('responseWeather', responseWeather.data.DailyForecasts);
            this.setState({
                weather: responseWeather.data.DailyForecasts,
            });
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    setWeatherAndLocation = async (latitude, longitude) => {
        const responseLocation = await this.getCurrentLocation(latitude, longitude);
        if (responseLocation) {
            const { Key, LocalizedName, AdministrativeArea } = responseLocation;

            this.setState({
                location: {
                    lat: latitude,
                    long: longitude,
                    city: LocalizedName,
                    state: AdministrativeArea.LocalizedName,
                    locationKey: Key,
                },
            });

            const responseCurrentWeather = await this.getCurrentConditionWeather(Key);
            if (responseCurrentWeather.data[0]) {
                this.setState({
                    currentCondition: {
                        temperature: responseCurrentWeather.data[0].Temperature.Imperial.Value,
                        icon: responseCurrentWeather.data[0].WeatherIcon,
                        text: responseCurrentWeather.data[0].WeatherText,
                    },
                });
                console.log('responseCurrentWeather', this.state.currentCondition);
            }

            const response5Days = await this.get5DaysConditionWeather(Key);
            if (response5Days) {
                console.log('response5Days', response5Days);
            }
        }
    };

    /* ************************************************************************** */
    /*                            Get 5 days condition                           */
    /* ************************************************************************** */
    get5DaysConditionWeather = async (locationKey) => {
        const url = URL_GET_5_DAYS_FORECASTS_ACCUWEATHER + locationKey;
        try {
            const response = await axios.get(url, {
                params: {
                    apikey: 'qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ',
                },
            });

            return response.data.DailyForecasts;
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    /* ************************************************************************** */
    /*                        Get current condition weather                       */
    /* ************************************************************************** */
    getCurrentConditionWeather = async (locationKey) => {
        const url = URL_GET_CURRENT_CONDITION_ACCUWEATHER + locationKey;
        try {
            const response = await axios.get(url, {
                params: {
                    apikey: 'qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ',
                },
            });

            return response;
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    /* ************************************************************************** */
    /*                        Get locationKey, city, state                        */
    /* ************************************************************************** */
    getCurrentLocation = async (lat, long) => {
        // NOTE: Generate lat and long string for seaching query
        const qValue = `${lat},${long}`;

        try {
            const response = await axios.get(URL_GET_LOCATION_INFO_ACCUWEATHER, {
                params: {
                    apikey: 'qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ',
                    q: qValue,
                },
            });
            return response.data;
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    /* ************************************************************************** */
    /*         fetch data from ipdata to get lat and long form IP address         */
    /* ************************************************************************** */
    getCurrentPositionFromIPDATA = async () => {
        try {
            const response = await axios.get('https://api.ipdata.co', {
                params: {
                    'api-key': 'dde34ed086411dd60e5f065bed89229183f99a39a74728cc7cc28a89',
                },
            });
            return response.data;
        } catch (error) {
            this.setState({
                error,
            });
        }
    };

    render() {
        const { currentTime, isAM, date, location, currentCondition } = this.state;
        return (
            <React.Fragment>
                <MDBContainer
                    fluid
                    size="lg"
                    id="parent_body"
                    className="purple-gradient p-lg-5 justify-content-center align-item-middle d-flex flex-column"
                    middle
                >
                    <MDBRow
                        center
                        middle
                        id="top_body"
                        className="cyan lighten-3 w-100 z-depth-4 border-0"
                        // style={{ minHeight: '60vh' }}
                    >
                        <MDBCol size="sm" className="pt-sm-2">
                            Left
                        </MDBCol>
                        <MDBCol size="sm" className="pt-sm-2">
                            Right
                        </MDBCol>
                    </MDBRow>
                    <MDBRow
                        center
                        middle
                        id="bottom_body"
                        className="amber w-100 mt-3 z-depth-2 border-0 grey lighten-2 transparent  text-center"
                        // style={{ minHeight: '20vh', opacity: 0.5 }}
                    >
                        <MDBCol size="sm">1</MDBCol>
                        <MDBCol size="sm">
                            <h1>1</h1>
                            <h1>1</h1>
                            <h1>1</h1>
                            <h1>1</h1>
                            <h1>1</h1>
                            <h1>1</h1>
                            <h1>1</h1>
                        </MDBCol>
                        <MDBCol size="sm">2</MDBCol>
                        <MDBCol size="sm">2</MDBCol>
                        <MDBCol size="sm">2</MDBCol>
                    </MDBRow>
                </MDBContainer>
            </React.Fragment>
        );
    }
}

export default App;
