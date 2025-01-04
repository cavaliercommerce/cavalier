import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export async function GET() {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
  return NextResponse.json({ version: packageJson.version || "N/A" }, { status: 200 });
}
