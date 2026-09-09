// ============================================================
// SIH 26018 — Dashboard Stats API
// GET /api/dashboard — aggregate stats for dashboard
// ============================================================

import { NextResponse } from "next/server";
import { getDashboardStats } from "../../../lib/db/mockStore";
import { seedDemoData } from "../../../lib/db/seedData";

export async function GET() {
  seedDemoData(); // Idempotent — only seeds once
  const stats = getDashboardStats();
  return NextResponse.json(stats);
}
