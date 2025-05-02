import React from "react";

interface MapProps {
  latitude: number;
  longitude: number;
}

/**
 * Map component that renders a google map.
 * This is separated into its own component to allow for dynamic importing.
 */
const WebMap: React.FC<MapProps> = ({ latitude, longitude }) => {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  return (
    <iframe
      src={mapUrl}
      width="100%"
      height="300"
      style={{ border: 0 }}
      allowFullScreen={false}
      aria-hidden="false"
      title="Map"
    ></iframe>
  );
};

export default WebMap;
