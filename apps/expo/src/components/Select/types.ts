import { ViewProps } from "react-native";

/** A single option in the Select. */
export interface SelectOption {
  label: string;
  value: string;
}

/** Props for the Select component. */
export interface SelectProps extends Omit<ViewProps, "children"> {
  /** List of selectable options (label/value pairs). */
  options: SelectOption[];
  /** Currently selected value, or null if none is selected yet. */
  value: string | null;
  /** Callback when the user selects a new value. */
  onChange: (newValue: string) => void;
  /**
   * Called when the select gains focus (e.g. user clicks/focuses on it on web,
   * or focuses the Pressable on iOS/Android).
   */
  onFocus?: () => void;
}
