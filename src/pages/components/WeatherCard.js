import React from "react";
import { MDBIcon } from "mdbreact";

const WeatherCard = (props) => {
  const { day, highest, icon, icon_size, icon_color, lowest } = props;
  return (
    <div className="text-center">
      <p className="h4 text-white">{day}</p>
      <p>
        <MDBIcon icon={icon} size={icon_size} className={icon_color} />
      </p>
      <p className="h5">
        {highest}
        <sup>°F</sup> / {lowest}
        <sup>°F</sup>
      </p>
    </div>
  );
};

export default WeatherCard;
