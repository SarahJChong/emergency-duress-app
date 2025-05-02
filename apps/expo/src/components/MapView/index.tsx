import React from "react";
import { Linking, Platform, View } from "react-native";

import Button from "@/components/Button";
import Map from "./Map";

interface LocationMapViewProps {
  latitude: number;
  longitude: number;
}

/**
 * A component that displays a location on a map and provides a button to open
 * the location in the device's native maps application.
 *
 * @param latitude - The latitude coordinate to display
 * @param longitude - The longitude coordinate to display
 */
const LocationMapView: React.FC<LocationMapViewProps> = ({
  latitude,
  longitude,
}) => {
  /**
   * Detects if the current device is running iOS/MacOS in a web browser
   */
  const isAppleWebDevice = React.useMemo(() => {
    if (Platform.OS !== "web") return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("mac") ||
      ua.includes("iphone") ||
      ua.includes("ipad") ||
      ua.includes("ipod")
    );
  }, []);

  const handleOpenInMaps = () => {
    const latLng = `${latitude},${longitude}`;
    const label = "Incident Location";

    // Handle web platforms first
    if (Platform.OS === "web") {
      if (isAppleWebDevice) {
        // Use Apple Maps for Apple devices on web
        Linking.openURL(`http://maps.apple.com/?q=${label}@${latLng}`);
        return;
      }
      // Use Google Maps for other web devices
      Linking.openURL(`https://maps.google.com/?q=${latLng}`);
      return;
    }

    // Handle native platforms
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `https://maps.google.com/?q=${latLng}`,
    });

    Linking.openURL(url);
  };

  return (
    <View className="overflow-hidden rounded-lg">
      <Map latitude={latitude} longitude={longitude} />
      <View className="mt-2">
        <Button onPress={handleOpenInMaps}>Open in Maps</Button>
      </View>
    </View>
  );
};

export default LocationMapView;
