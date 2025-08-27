import { useEffect, useState, memo, useCallback } from 'react'
import './App.css'
import { Map as GoogleMap, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import BalloonMarkers from './components/BalloonMarkers';
import { Skeleton, Slider } from "@mui/material";

const BallonsMapComponent = ({ balloons, setSelectedBalloon, fetchWeatherData }) => (
  <div style={{ width: '650px', height: '400px' }}>
    <GoogleMap
      defaultZoom={1}
      defaultCenter={{ lat: 0, lng: 0 }}
      mapId='4aa216f437bcb0812a3a1453'
      streetViewControl={false}>
      <BalloonMarkers
        balloons={balloons}
        handleBalloonClick={(key) => {
          setSelectedBalloon(key);
          fetchWeatherData(key)
        }} />
    </GoogleMap>
  </div>
);

const BallonsMap = memo(BallonsMapComponent);

const App = () => {
  const [balloons, setBalloons] = useState(new Map());
  const [selectedBalloon, setSelectedBalloon] = useState(-1);
  const [weatherData, setWeatherData] = useState(new Map());
  const [sliderValue, setSliderValue] = useState(0);
  const smallMap = useMap('smallMap');

  const fetchData = async () => {
    const fetchedBalloons = new Map();
    for (let num = 0; num < 24; num++) {
      const fetchUrl = num < 10 ? `/balloonsApi/0${num.toString()}.json` : `/balloonsApi/${num.toString()}.json`;

      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const data = await response.json();
          data.forEach((balloon, index) => {
            let newArr = fetchedBalloons.get(index) || [];
            newArr.push(balloon);
            fetchedBalloons.set(index, newArr);
          });
        } else {
          console.error(`Error: ${response.status}`);
        }
      } catch (err) {
        console.error(`Error: `, err)
      }
    }
    setBalloons(fetchedBalloons);
  }

  const fetchWeatherData = useCallback(async (key) => {
    if (weatherData.has(key)) {
      return;
    }

    try {
      const updatedWeatherData = new Map(weatherData);
      const fetchPromises = [];
      
      for (let num = 0; num < 24; num++) {
        const lat = balloons.get(key)[num][0];
        const lng = balloons.get(key)[num][1];
        const url = `/weatherApi?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&past_days=1&forecast_days=1&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;

        fetchPromises.push(
          fetch(url).then(response => response.ok ? response.json() : null)
        );
      }

      const weatherArr = await Promise.all(fetchPromises);
      updatedWeatherData.set(key, weatherArr.filter(data => data !== null));
      setWeatherData(updatedWeatherData);
    } catch (err) {
      console.error(`Error: `, err)
    }
  }, [balloons, weatherData]);

  const handleSetSelectedBalloon = useCallback((key) => {
    setSelectedBalloon(key);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!smallMap || selectedBalloon == -1) return;
    smallMap.panTo({ lat: balloons.get(selectedBalloon)[0][0], lng: balloons.get(selectedBalloon)[0][1] });
  }, [selectedBalloon, balloons, smallMap])

  const currentHour = new Date().getHours();
  const sliderLabel = (hour) => {
    if (hour > 9) {
      return `${hour}:00`;
    }
    if (hour > -1) {
      return `0${hour}:00`;
    }
    if (hour > -15) {
      return `${24 + hour}:00`;
    }
    return `0${24 + hour}:00`;
  }

  const marks = [
    { value: -23, label: sliderLabel(currentHour - 23) },
    { value: -20, label: sliderLabel(currentHour - 20) },
    { value: -16, label: sliderLabel(currentHour - 16) },
    { value: -12, label: sliderLabel(currentHour - 12) },
    { value: -8, label: sliderLabel(currentHour - 8) },
    { value: -4, label: sliderLabel(currentHour - 4) },
    { value: 0, label: sliderLabel(currentHour) }
  ];

  return (
    <>
      <BallonsMap balloons={balloons} setSelectedBalloon={handleSetSelectedBalloon} fetchWeatherData={fetchWeatherData} />
      {
        selectedBalloon != -1 ?
          <div style={{ margin: '10px', display: 'flex' }}>
            <div style={{ display: 'grid' }}>
              <h2> Select another balloon or slide for details! </h2>
              <GoogleMap
                defaultZoom={6}
                defaultCenter={{ lat: balloons.get(selectedBalloon)[0][0], lng: balloons.get(selectedBalloon)[0][1] }}
                mapId='4aa216f437bcb0812df1f688'
                id='smallMap'
                streetViewControl={false}
                style={{ width: '475px', height: '300px' }}>
                <AdvancedMarker
                  key={selectedBalloon + 'map2'}
                  position={{ lat: balloons.get(selectedBalloon)[-sliderValue][0], lng: balloons.get(selectedBalloon)[-sliderValue][1] }}>
                  <Pin />
                </AdvancedMarker>
              </GoogleMap>
              <Slider
                aria-label="Always visible"
                min={-23}
                max={0}
                value={sliderValue}
                onChange={(e, v) => { setSliderValue(v) }}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => { return sliderLabel(currentHour + value) }}
                marks={marks}
              />
            </div>
            <div style={{ width: "200px", display: 'flex', alignItems: "center", marginLeft: "20px" }}>
              <div style={{ display: "grid" }}>
              { weatherData.has(selectedBalloon) ?
                  <>
                    <p> Temperature (°F): { weatherData.get(selectedBalloon)[-sliderValue]['hourly']['temperature_2m'][24 + new Date().getHours() + sliderValue]}</p>
                    <p> Precipitation (in): { weatherData.get(selectedBalloon)[-sliderValue]['hourly']['precipitation'][24 + new Date().getHours() + sliderValue]}</p>
                    <p> Wind Speed (mph): {weatherData.get(selectedBalloon)[-sliderValue]['hourly']['wind_speed_10m'][24 + new Date().getHours() + sliderValue]}</p>
                  </>
                : 
                <>
                  <Skeleton width={200} height={90} variant='rounded' style={{marginBottom : "10px"}}/>
                  <Skeleton width={200} height={90} variant='rounded' style={{marginBottom : "10px"}}/>
                  <Skeleton width={200} height={90} variant='rounded'/>
                </>
              }
              </div>
            </div>
          </div> : <h2> Select a balloon! </h2>
      }
    </>
  );
}

export default App;
