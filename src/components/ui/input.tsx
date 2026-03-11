import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

type InputProps = TextInputProps & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        "w-full rounded-xl border bg-bg-input px-4 py-3.5 text-base text-text min-h-[48px]",
        error ? "border-danger" : "border-border focus:border-accent",
        className,
      )}
      placeholderTextColor="#63636e"
      autoCorrect={false}
      {...props}
    />
  );
}
