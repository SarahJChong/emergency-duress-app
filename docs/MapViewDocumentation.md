# MapView Documentation

## Introduction & Overview

This document provides detailed documentation for the `LocationMapView` component used in the Expo app. The component displays a specified location on a map and includes a button to open the location in the device's native maps application.

## Component Purpose

`LocationMapView` is designed to:

- Display a map centered on provided latitude and longitude coordinates.
- Provide a button that, when pressed, opens the location in a native maps application.
- Handle cross-platform functionality, enabling different behaviors for web and native platforms.

## Props

| Prop      | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| latitude  | number | The latitude coordinate to display.  |
| longitude | number | The longitude coordinate to display. |

## Usage

Below is an example of how to import and use the `LocationMapView` component:

```tsx
import React from "react";
import LocationMapView from "@/components/MapView";

const Example = () => (
  <LocationMapView latitude={-33.865143} longitude={151.2099} />
);

export default Example;
```

## Implementation Details

The component is implemented with the following key details:

- **Platform Detection:** Uses React Native's `Platform` module to determine if the app is running on the web or a native platform.
  - For web, it further checks if the user agent corresponds to an Apple device.
- **Mapping Behavior:**
  - On **web**:
    - Apple devices use the URL: `http://maps.apple.com/?q=Incident Location@<lat>,<lng>`
    - Other devices use the URL: `https://maps.google.com/?q=<lat>,<lng>`
  - On **native** platforms:
    - iOS uses the scheme `maps:` and Android uses `geo:`
    - The URL is formatted accordingly to open the native maps application.
- **Button Interaction:** A button labeled "Open in Maps" triggers the opening of the maps URL based on the detected platform.

## Component Flow

The following Mermaid diagram illustrates the logic flow of the `LocationMapView` component:

```mermaid
flowchart TD
    A[Component receives latitude & longitude] --> B[Determine Platform]
    B -->|Web| C[Check for Apple device]
    C -->|Yes| D[Open Apple Maps URL]
    C -->|No| E[Open Google Maps URL]
    B -->|Native| F[Determine platform scheme (iOS/Android)]
    F --> G[Format URL accordingly]
    G --> H[Open native maps application]
```

## Summary & Enhancements

`LocationMapView` plays a crucial role in allowing users to quickly view incident locations using their preferred maps application. Potential enhancements include:

- Improved error handling for URL opening failures.
- More granular user feedback on maps integration status.
- Expansion to support additional map providers if needed.

---

This documentation aims to assist developers in understanding and maintaining the `LocationMapView` component.
