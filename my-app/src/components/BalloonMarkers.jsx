import { useEffect, useState, useRef } from 'react'
import { AdvancedMarker, Pin, useMap} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const BalloonMarkers = ({balloons, handleBalloonClick}) => {
    const map = useMap();
    const [markers, setMarkers] = useState({});
    const clusterer = useRef(null);
  
    useEffect(() => {
      if (!map) return;
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({map});
      }
    }, [map]);
  
    useEffect(() => {
      clusterer.current?.clearMarkers();
      clusterer.current?.addMarkers(Object.values(markers));
    }, [markers]);
  
    const setMarkerRef = (marker, key) => {
      if (marker && markers[key]) return;
      if (!marker && !markers[key]) return;
  
      setMarkers(prev => {
        if (marker) {
          return {...prev, [key]: marker};
        } else {
          const newMarkers = {...prev};
          delete newMarkers[key];
          return newMarkers;
        }
      });
    };
  
    return (
      <>
        {Array.from(balloons).map(([key, value]) => 
          <AdvancedMarker 
            key={key + 'map1'} 
            position={{lat: value[0][0], lng: value[0][1]}}
            ref={marker => setMarkerRef(marker, key)}
            onClick={() => handleBalloonClick(key)}>
            <Pin/>
          </AdvancedMarker>
        )}
      </>
    );
  };

  export default BalloonMarkers;