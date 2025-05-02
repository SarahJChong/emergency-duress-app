import React from "react";
import MapView, { Marker } from "react-native-maps";

interface MapProps {
  latitude: number;
  longitude: number;
}

/**
 * Map component that renders the native map.
 * This is separated into its own component to allow for dynamic importing.
 */
const Map: React.FC<MapProps> = ({ latitude, longitude }) => {
  return (
    <MapView
      className="h-48 w-full"
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
      />
    </MapView>
  );
};

export default Map;
