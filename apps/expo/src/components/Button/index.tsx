import React from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  Text,
  TextProps,
} from "react-native";
import { tv, VariantProps } from "tailwind-variants";

import { cn } from "@/utils/cn";

/**
 * Button component styling configuration using tailwind-variants.
 * Supports different colors, sizes, and variants (solid/outline).
 * Sizes range from xs to lg, affecting both text size and padding.
 */
const button = tv({
  slots: {
    pressable:
      "items-center justify-center rounded-md hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
    text: "",
  },
  variants: {
    color: {
      primary: {
        pressable: "bg-primary",
        text: "text-white",
      },
      secondary: {
        pressable: "bg-secondary",
        text: "text-white",
      },
      destructive: {
        pressable: "bg-red-600",
        text: "text-white",
      },
    },
    size: {
      xs: {
        pressable: "h-8 px-3.5",
        text: "text-xs",
      },
      sm: {
        pressable: "h-9 px-4",
        text: "text-sm",
      },
      md: {
        pressable: "h-10 px-5",
        text: "text-base",
      },
      lg: {
        pressable: "h-11 px-6",
        text: "text-lg",
      },
    },
    variant: {
      solid: {},
      outline: {
        pressable: "border-2 bg-transparent",
      },
    },
    disabled: {
      true: {
        pressable: "cursor-not-allowed bg-gray-500",
        text: "text-gray-400",
      },
    },
  },
  compoundVariants: [
    {
      variant: "outline",
      color: "primary",
      class: {
        pressable: "border-primary",
        text: "text-primary",
      },
    },
    {
      variant: "outline",
      color: "secondary",
      class: {
        pressable: "border-secondary",
        text: "text-secondary",
      },
    },
    {
      variant: "outline",
      color: "destructive",
      class: {
        pressable: "border-red-600",
        text: "text-red-600",
      },
    },
    {
      variant: "outline",
      disabled: true,
      class: {
        pressable: "border-gray-300 bg-transparent",
        text: "text-gray-300",
      },
    },
    {
      variant: "solid",
      class: {
        text: "text-white",
      },
    },
  ],
  defaultVariants: {
    color: "primary",
    size: "md",
    variant: "solid",
  },
});

/**
 * Props for the Button component.
 * @extends {Omit<PressableProps, "disabled" | "children">} - Base props from PressableProps
 * @extends {Pick<TextProps, "children">} - Children prop from TextProps
 * @extends {VariantProps<typeof button>} - Variant props from tailwind-variants
 */
export interface ButtonProps
  extends Omit<PressableProps, "disabled" | "children">,
    Pick<TextProps, "children">,
    VariantProps<typeof button> {
  /** Additional className for text styling */
  textClassName?: string;
}

/**
 * Button component that supports various visual styles and states.
 *
 * @component
 * @example
 * ```tsx
 * // Solid primary button (default)
 * <Button>Click me</Button>
 *
 * // Extra small secondary button
 * <Button size="xs" color="secondary">Small</Button>
 *
 * // Outline variant with secondary color
 * <Button variant="outline" color="secondary">Click me</Button>
 *
 * // Large destructive button
 * <Button color="destructive" size="lg">Delete</Button>
 * ```
 */
const Button = ({
  disabled,
  color,
  size,
  variant,
  children,
  className,
  textClassName,
  ...props
}: ButtonProps) => {
  const slots = button({ disabled, color, size, variant });
  return (
    <Pressable
      className={cn(slots.pressable(), className)}
      disabled={disabled}
      aria-disabled={disabled}
      role="button"
      {...props}
    >
      {Platform.OS === "web" ? (
        <span className={cn(slots.text(), textClassName)}>{children}</span>
      ) : (
        <Text className={cn(slots.text(), textClassName)}>{children}</Text>
      )}
    </Pressable>
  );
};

export default Button;
