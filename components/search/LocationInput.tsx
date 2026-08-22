"use client";

import LocationSearch, { type LocationSearchProps } from "@/components/location/LocationSearch";

export type LocationInputProps = Omit<LocationSearchProps, "label"> & {
  label?: string;
};

export default function LocationInput({ label, placeholder = "장소 검색", ...props }: LocationInputProps) {
  return <LocationSearch {...props} label={label ?? placeholder} placeholder={placeholder} />;
}
