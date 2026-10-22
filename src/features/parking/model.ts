export interface ParkingInput {
  garageName: string;
  level: string;
  row: string;
  spotNumber?: string;
}

export interface ParkingSession extends ParkingInput {
  id: string;
  status: "active" | "archived";
  parkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class ParkingValidationError extends Error {}

export function validateParking(input: ParkingInput): ParkingInput {
  const garageName = input.garageName.trim();
  const level = input.level.trim().toUpperCase();
  const row = input.row.trim().toUpperCase();
  const spotNumber = input.spotNumber?.trim();
  if (!garageName || !level || !row)
    throw new ParkingValidationError(
      "Enter a garage, level, and row before saving.",
    );
  if (
    garageName.length > 120 ||
    level.length > 20 ||
    row.length > 20 ||
    (spotNumber?.length ?? 0) > 30
  ) {
    throw new ParkingValidationError("Check the field lengths and try again.");
  }
  return { garageName, level, row, ...(spotNumber ? { spotNumber } : {}) };
}
