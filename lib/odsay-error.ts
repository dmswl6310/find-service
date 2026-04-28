import { OdsayErrorEntry } from "@/types/odsay";

export function getOdsayErrorEntry(
  error?: OdsayErrorEntry | OdsayErrorEntry[]
): OdsayErrorEntry | undefined {
  if (!error) {
    return undefined;
  }

  return Array.isArray(error) ? error[0] : error;
}

export function getOdsayRouteErrorStatus(code?: string): number {
  switch (code) {
    case "-8":
    case "-9":
      return 400;
    case "3":
    case "4":
    case "5":
    case "6":
    case "-99":
      return 404;
    default:
      return 502;
  }
}

export function normalizeOdsayErrorPayload(
  error?: OdsayErrorEntry | OdsayErrorEntry[],
  fallbackMessage?: string
): { error: string; errorCode?: string } {
  const errorEntry = getOdsayErrorEntry(error);

  return {
    error: errorEntry?.msg || errorEntry?.message || fallbackMessage || "ODsay API request failed",
    errorCode: errorEntry?.code,
  };
}
