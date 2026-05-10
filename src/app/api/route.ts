import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "NurseOS API",
    version: "1.0.0",
    description: "The Operating System for Global Nursing Care",
    modules: ["NurseAI", "CareGrid", "NurseAnalytics", "NurseID", "NurseAcademy"],
  });
}
