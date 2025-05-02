import { View } from "react-native";
import { MotiView } from "moti";

interface BlinkingDotProps {
  /** Size of the dot in pixels */
  size?: number;
  /** Color of the dot */
  color?: string;
  /** Duration of one blink cycle in milliseconds */
  duration?: number;
}

/**
 * A blinking dot indicator component using Moti animations
 */
export default function BlinkingDot({
  size = 8,
  color = "#ef4444",
  duration = 1000,
}: BlinkingDotProps) {
  return (
    <View className="flex-row items-center">
      <MotiView
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginRight: 4,
        }}
        animate={{
          opacity: [0, 1],
        }}
        transition={{
          type: "timing",
          duration: duration,
          loop: true,
        }}
      />
    </View>
  );
}
