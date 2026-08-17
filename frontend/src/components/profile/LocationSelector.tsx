import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { toast } from "sonner";
import { validateTextInput } from "@/lib/validation";

interface LocationSelectorProps {
  city: string;
  country: string;
  onLocationChange: (
    city: string,
    country: string,
    lat?: number,
    lng?: number,
  ) => void;
  variant?: "light" | "dark";
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  city,
  country,
  onLocationChange,
  variant = "dark",
}) => {
  const [cityInput, setCityInput] = useState(city || "");
  const [countryInput, setCountryInput] = useState(country || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleUseMyLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Pass GPS coordinates directly to profile form state. City/Country
        // will be resolved asynchronously by the server-side queue if missing.
        onLocationChange(
          cityInput.toLowerCase(),
          countryInput.toLowerCase(),
          latitude,
          longitude,
        );
        toast.success("Current GPS coordinates captured!");
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Location permission denied. Please type your location manually.");
        setIsLoading(false);
      },
    );
  };

  const handleManualUpdate = (overrideCity?: string, overrideCountry?: string) => {
    const effectiveCity = overrideCity !== undefined ? overrideCity : cityInput;
    const effectiveCountry = overrideCountry !== undefined ? overrideCountry : countryInput;

    if (effectiveCity && effectiveCountry) {
      const cityValidation = validateTextInput(effectiveCity);
      const countryValidation = validateTextInput(effectiveCountry);

      if (!cityValidation.isValid) {
        toast.error(cityValidation.message);
        return;
      }

      if (!countryValidation.isValid) {
        toast.error(countryValidation.message);
        return;
      }

      // Pass city and country to profile form state. The server-side
      // geocoding queue will resolve lat/lng asynchronously at 1 req/sec.
      onLocationChange(effectiveCity.toLowerCase(), effectiveCountry.toLowerCase());
    }
  };

  const sortedCountries = ["india", ...COUNTRIES.filter((c) => c !== "india")];

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="city"
          className={variant === "light" ? "text-foreground" : "text-gray-300"}
        >
          City <span className="text-destructive">*</span>
        </Label>
        <Input
          id="city"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onBlur={(e) => handleManualUpdate(e.target.value, undefined)}
          placeholder="Enter your city"
          className={
            variant === "light"
              ? "bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
              : "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
          }
        />
      </div>

      <div>
        <Label
          htmlFor="country"
          className={variant === "light" ? "text-foreground" : "text-gray-300"}
        >
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={countryInput}
          onValueChange={(val) => {
            setCountryInput(val);
            handleManualUpdate(undefined, val);
          }}
        >
          <SelectTrigger
            className={
              variant === "light"
                ? "bg-background border-input text-foreground focus:border-ring focus:ring-ring"
                : "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
            }
          >
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-overlay">
            {sortedCountries.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={isLoading}
        className={
          variant === "light"
            ? "w-full bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            : "w-full bg-black/20 border-white/10 text-white hover:bg-black/30 hover:text-white"
        }
      >
        <MapPin className="h-4 w-4 mr-2" />
        {isLoading ? "Detecting..." : "Use My Location"}
      </Button>
    </div>
  );
};

export default LocationSelector;
