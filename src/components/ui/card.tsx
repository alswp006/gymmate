import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

type CardProps = ViewProps & {
  title: string;
  description?: string;
  icon?: string;
};

export function Card({ title, description, icon, className, children, ...props }: CardProps) {
  return (
    <View
      className={cn("rounded-2xl border border-border bg-bg-card p-5", className)}
      accessibilityRole="summary"
      {...props}
    >
      {icon ? (
        <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
          <Text className="text-lg">{icon === "zap" ? "\u26A1" : icon === "sparkles" ? "\u2728" : icon === "shield" ? "\uD83D\uDD12" : "\u2B50"}</Text>
        </View>
      ) : null}
      <Text className="text-base font-semibold text-text mb-1">{title}</Text>
      {description ? <Text className="text-sm text-text-secondary leading-5">{description}</Text> : null}
      {children}
    </View>
  );
}
