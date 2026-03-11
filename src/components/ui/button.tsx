import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "outline";

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-accent active:bg-accent-hover",
  secondary: "bg-bg-elevated border border-border active:bg-bg-card",
  ghost: "active:bg-bg-elevated",
  destructive: "bg-danger-soft active:bg-danger/20",
  outline: "border border-border active:bg-bg-elevated",
};

const textStyles: Record<ButtonVariant, string> = {
  default: "text-white",
  secondary: "text-text",
  ghost: "text-text-secondary",
  destructive: "text-danger",
  outline: "text-text",
};

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({ label, variant = "default", loading, className, disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        "flex-row items-center justify-center rounded-xl px-6 py-3.5 min-h-[48px]",
        variantStyles[variant],
        (disabled || loading) && "opacity-50",
        className,
      )}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "default" ? "#fff" : "#3b82f6"} />
      ) : (
        <Text className={cn("text-base font-semibold", textStyles[variant])}>{label}</Text>
      )}
    </Pressable>
  );
}
