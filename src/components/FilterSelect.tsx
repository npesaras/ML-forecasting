import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FilterSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void; // Backward compatibility
}

export function FilterSelect({
  label,
  value,
  onChange,
  onValueChange,
  options,
  placeholder = "Select an option",
  className,
}: FilterSelectProps) {
  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <div className={className}>
      <Label htmlFor={label} className="text-foreground mb-2 block">
        {label}
      </Label>
      <Select value={value?.toString()} onValueChange={handleChange}>
        <SelectTrigger id={label} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
