import React, { useState, useEffect, useReducer } from "react";
import "./App.css";

function App() {
  const locationReducer = (state, action) => {
    let newLocation = { ...state.location };
    let newRange = { ...state.range };
    let newIsInRange = state.isInRange;
    let newNewManualRangeError = state.newManualRangeError;
    let newPrecision = state.precision;
    let newLocationError = state.locationError;

    //dispatch({ type: "SET_PRECISION", payload: newPrecision });
    if (action.type == "SET_PRECISION") {
      newPrecision = parseFloat(action.payload);
    }
    //dispatch({ type: "SET_LOCATION", payload: newLocation });
    if (action.type == "SET_LOCATION") {
      newLocation = action.payload;
    }

    //dispatch({ type: "SET_LOCATION_ERROR", payload: newLocationError });
    if (action.type == "SET_LOCATION_ERROR") {
      newLocationError = action.payload;
    }

    //dispatch({ type: "SET_RANGE_CURRENT_LOCATION" });
    if (action.type == "SET_RANGE_CURRENT_LOCATION") {
      if (
        newPrecision == "" ||
        newPrecision == 0 ||
        newPrecision == null ||
        newPrecision == undefined
      )
        newPrecision = 1.0;
      newRange = {
        maxLatitude: (newLocation.latitude + newPrecision/2).toFixed(7),
        minLatitude: (newLocation.latitude - newPrecision/2).toFixed(7),
        maxLongitude: (newLocation.longitude + newPrecision/2).toFixed(7),
        minLongitude: (newLocation.longitude - newPrecision/2).toFixed(7),
      };
    }

    //dispatch({ type: "SET_RANGE", payload: newRange });
    if (action.type == "SET_RANGE") {
      newNewManualRangeError = "";
      if (action.payload.maxLatitude != null)
        newRange.maxLatitude = parseFloat(action.payload.maxLatitude);
      if (action.payload.minLatitude != null)
        newRange.minLatitude = parseFloat(action.payload.minLatitude);
      if (action.payload.maxLongitude != null)
        newRange.maxLongitude = parseFloat(action.payload.maxLongitude);
      if (action.payload.minLongitude != null)
        newRange.minLongitude = parseFloat(action.payload.minLongitude);
      if (
        parseFloat(newRange.maxLatitude) <= parseFloat(newRange.minLatitude)
      ) {
        newNewManualRangeError =
          "Max latitude must be greater than min latitude";
        newRange = { ...state.range };
      } else if (
        parseFloat(newRange.maxLongitude) <= parseFloat(newRange.minLongitude)
      ) {
        newNewManualRangeError =
          "Max longitude must be greater than min longitude";
        newRange = { ...state.range };
      }
    }

    //check if location is in range
    if (newLocation.latitude != 0 && newLocation.longitude != 0) {
      if (
        parseFloat(newLocation.latitude) > parseFloat(newRange.maxLatitude) ||
        parseFloat(newLocation.latitude) < parseFloat(newRange.minLatitude) ||
        parseFloat(newLocation.longitude) > parseFloat(newRange.maxLongitude) ||
        parseFloat(newLocation.longitude) < parseFloat(newRange.minLongitude)
      ) {
        newIsInRange = false;
      } else {
        newIsInRange = true;
      }
    } else {
      newIsInRange = false;
      newNewManualRangeError = "Location is not available";
    }

    return {
      ...state,
      location: newLocation,
      locationError: newLocationError,
      range: newRange,
      isInRange: newIsInRange,
      newManualRangeError: newNewManualRangeError,
      precision: newPrecision,
    };
  };

  const initialState = {
    range: { maxLatitude: 0, minLatitude: 0, maxLongitude: 0, minLongitude: 0 },
    location: { latitude: 0, longitude: 0 },
    locationError: "",
    isInRange: false,
    newManualRangeError: "",
    precision: 0.0001,
  };
  const [state, dispatch] = useReducer(locationReducer, initialState);

  const [newManualRange, setNewManualRange] = useState({});
  const [audioLink, setAudioLink] = useState(
    "https://www.soundjay.com/misc/magic-chime-02.mp3"
  );

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch({ type: "SET_LOCATION", payload: { latitude, longitude } });
        },
        (error) => {
          dispatch({
            type: "SET_LOCATION_ERROR",
            payload: "Error: " + error.message,
          });
        }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.log("Geolocation is not available");
    }
  }, []);

  useEffect(() => {
    if (state?.isInRange) {
      const audio = new Audio(
        audioLink
      );
      audio.play();
    }
  }, [state.isInRange, audioLink]);

  return (
    <>
      <div className="card ms-5 mt-3" style={{ width: "18rem" }}>
        <div className="card-body">
          <h5 className="card-title">Current location</h5>
          <div className="mt-3">
            <p>Latitude: {state.location.latitude}</p>
            <p>Longitude: {state.location.longitude}</p>
            <p className="card-title">
              Is in range? {state.isInRange ? "Yes" : "No"}
            </p>
            <p className="card-title mt-3 mb-0"> {state.locationError}</p>
          </div>
        </div>
        <button
          className="mt-1 btn btn-secondary"
          onClick={() => dispatch({ type: "SET_RANGE_CURRENT_LOCATION" })}
        >
          Set range with current location
        </button>
        <div className="card-body">
          <p>
            Precision (0.0001≈11m):
            <input
              value={state.precision}
              type="number"
              min="0.00"
              step="0.001"
              max="1.00"
              onChange={(e) =>
                dispatch({ type: "SET_PRECISION", payload: e.target.value })
              }
              className="ms-2"
              style={{ width: "100px" }}
            ></input>
          </p>
        </div>
      </div>

      <div className="card ms-5 mt-3" style={{ width: "18rem" }}>
        <div className="card-body">
          <h5 className="card-title">Range</h5>
          <div className="mt-3">
            {Object.keys(state.range).map((key) => {
              return (
                <p key={key}>
                  {key}: {state.range[key]} <br />
                  <input
                    name={key}
                    type="number"
                    step="0.00001"
                    value={newManualRange[key]}
                    onChange={(e) =>
                      setNewManualRange({
                        ...newManualRange,
                        [key]: e.target.value,
                      })
                    }
                  ></input>
                </p>
              );
            })}
          </div>
          <a
            href="#"
            className=""
            onClick={(e) => {
              e.preventDefault();
              setNewManualRange({
                maxLatitude: state.range.maxLatitude,
                minLatitude: state.range.minLatitude,
                maxLongitude: state.range.maxLongitude,
                minLongitude: state.range.minLongitude,
              });
            }}
          >
            Copy current values<br/>
          </a>
          <span>The arrows move 0.00001≈1m</span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            console.log(newManualRange);
            dispatch({ type: "SET_RANGE", payload: newManualRange });
          }}
        >
          Update values manually
        </button>
      </div>
      <div className="mx-5 mt-1">
        <p className="danger-text">{state.newManualRangeError}</p>
      </div>
      <div className="card ms-5 mt-3 mb-3" style={{ width: "90%" }}>
        <div className="card-body">
          <h5 className="card-title">The audio to be reproduced:</h5>
          <div className="mt-3">
            <input
              style={{ width: "100%" }}
              name="audio"
              type="string"
              value={audioLink}
              onChange={(e) => setAudioLink(e.target.value)}
            ></input>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
