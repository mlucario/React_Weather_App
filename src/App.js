import React from "react";
import { MDBContainer, MDBRow, MDBCol, MDBBtn, MDBIcon } from "mdbreact";
import { format } from "date-fns";
import "./App.css";

/* -------------------------------- Component ------------------------------- */
import WeatherCard from "./pages/components/WeatherCard";

/* ---------------------------- support libraries --------------------------- */
const _ = require("lodash");
const axios = require("axios");

const URL_GET_CURRENT_CONDITION_ACCUWEATHER =
  "http://dataservice.accuweather.com/currentconditions/v1/";

const URL_GET_LOCATION_INFO_ACCUWEATHER =
  "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search";

const URL_GET_5_DAYS_FORECASTS_ACCUWEATHER =
  "http://dataservice.accuweather.com/forecasts/v1/daily/5day/";

class App extends React.Component {
  state = {
    currentTime: "",
    isAM: true,
    date: "",
    location: {
      lat: "",
      long: "",
      city: "",
      state: "",
      locationKey: "",
    },
    weather: [],
    currentCondition: {},
    error: "",
  };

  // NOTE: componentDidMount will run immediately after a component is mounted
  // It means it will set state right away compenent created
  componentDidMount() {
    this.setState({
      date: format(new Date(), "MMMM, dd yyyy"),
    });
    // set time in here clock here
    setInterval(() => {
      this.setTime();
    }, 1000);
    this.setLocation(this.setWeatherAndLocation);
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
      currentTime: format(currentTime, "hh:mm:ss"),
      isAM: format(currentTime, "a") === "AM" ? true : false,
    });
  };

  getLocation = (callback) => {
    if ("geolocation" in navigator) {
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
            console.log("will it come hre");
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
        }
        /* ###################END  Second method: error ######################## */
      );
    } else {
      /* geolocation IS NOT available */
      this.setState({
        error: "geolocation IS NOT available",
      });
    }
  };

  getLocationFromLatAndLong = async (lat, long) => {
    const qValue = `${lat},${long}`;
    const cachedLocation = localStorage.getItem("");
    try {
      const response = await axios.get(
        "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search",
        {
          params: {
            apikey: "qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ",
            q: qValue,
          },
        }
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
            apikey: "qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ",
          },
        }
      );
      console.log("responseWeather", responseWeather.data.DailyForecasts);
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
            temperature:
              responseCurrentWeather.data[0].Temperature.Imperial.Value,
            icon: responseCurrentWeather.data[0].WeatherIcon,
            text: responseCurrentWeather.data[0].WeatherText,
          },
        });
        console.log("responseCurrentWeather", this.state.currentCondition);
      }

      const response5Days = await this.get5DaysConditionWeather(Key);
      if (response5Days) {
        console.log("response5Days", response5Days);
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
          apikey: "qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ",
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
          apikey: "qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ",
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
          apikey: "qtHJcbQ10qRM2TKZxQywsBVolkiKqfhJ",
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
      const response = await axios.get("https://api.ipdata.co", {
        params: {
          "api-key": "dde34ed086411dd60e5f065bed89229183f99a39a74728cc7cc28a89",
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
      <div className="flyout">
        <MDBContainer
          fluid
          size="md"
          className="spring-warmth-gradient vh-100 d-flex justify-content-center align-items-center"
        >
          <MDBRow
            className="deep-blue-gradient border border-0 rounded z-depth-4"
            style={{ minWidth: "90vw", minHeight: "90vh" }}
          >
            <div className="d-flex flex-column w-100">
              <div
                className="bg-primary h-75 row justify-content-center text-center"
                style={{
                  backgroundImage:
                    "url(" +
                    "https://images.pexels.com/photos/37728/pexels-photo-37728.jpeg?crop=entropy&cs=srgb&dl=above-atmosphere-clouds-flight-37728.jpg&fit=crop&fm=jpg&h=3643&w=5464" +
                    ")",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
              >
                <MDBCol size="4" className="mt-5 ">
                  <div className="active-pink-3 active-pink-4 w-50 mx-auto opct opacity-80">
                    <input
                      className="form-control rounded-pill grey darken-1 border-0  form-control-lg "
                      type="text"
                      placeholder="Search other places ..."
                      aria-label="Search"
                      style={{
                        backgroundColor: "transparent",
                        color: "white",
                      }}
                    />
                  </div>
                </MDBCol>
                <MDBCol size="4"> </MDBCol>
                <MDBCol size="4" className="p-5">
                  <div className="time_date white-text">
                    <p className="h1 display-4 font-weight-bolder ">
                      {currentTime}
                      <span className="h3">{isAM ? "AM" : "PM"}</span>
                    </p>
                    <p className="h3">{date}</p>
                    <p className="display-4 font-weight-bolder">
                      {location.city}, {location.state}
                    </p>
                  </div>
                </MDBCol>
              </div>
              <div className="bg-secondary h-25 row">
                <MDBCol className="white-text my-auto bg-aqua">
                  <MDBRow className="justify-content-center align-items-center">
                    <div className="col-6  mx-auto">
                      <p className="display-1 font-weight-bolder m-0 p-5">
                        {currentCondition.temperature}
                        <sup>°F</sup>
                      </p>
                    </div>
                    <div className="col-6 ">
                      <MDBRow center>
                        {/* <Image src="./img/icons/34.png" className="thumbnail" /> */}
                      </MDBRow>
                      <MDBRow center className="mt-3">
                        <span className="h5">{currentCondition.text}</span>º
                      </MDBRow>
                    </div>
                  </MDBRow>
                </MDBCol>
                <MDBCol md="9" middle>
                  <MDBRow middle>
                    <MDBCol>
                      <WeatherCard
                        day={"TUE"}
                        highest={50}
                        icon={"cloud-rain"}
                        icon_size={"5x"}
                        lowest={15}
                        icon_color={"amber-text"}
                      />
                    </MDBCol>
                    <MDBCol>
                      <WeatherCard
                        day={"TUE"}
                        highest={50}
                        icon={"cloud-rain"}
                        icon_size={"5x"}
                        lowest={15}
                        icon_color={"amber-text"}
                      />
                    </MDBCol>
                    <MDBCol>
                      <WeatherCard
                        day={"TUE"}
                        highest={50}
                        icon={"cloud-rain"}
                        icon_size={"5x"}
                        lowest={15}
                        icon_color={"amber-text"}
                      />
                    </MDBCol>
                    <MDBCol>
                      <WeatherCard
                        day={"TUE"}
                        highest={50}
                        icon={"cloud-rain"}
                        icon_size={"5x"}
                        lowest={15}
                        icon_color={"amber-text"}
                      />
                    </MDBCol>
                    <MDBCol>
                      <WeatherCard
                        day={"TUE"}
                        highest={50}
                        icon={"cloud-rain"}
                        icon_size={"5x"}
                        lowest={15}
                        icon_color={"amber-text"}
                      />
                    </MDBCol>
                  </MDBRow>
                </MDBCol>
              </div>
            </div>
          </MDBRow>
        </MDBContainer>
      </div>
    );
  }
}

export default App;
