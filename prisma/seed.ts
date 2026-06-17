import { PrismaClient, MatchStage } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Teams ────────────────────────────────────────────────────────────────────
// MŚ 2026: rzeczywiste 48 drużyn, 12 grup (A–L), wg losowania z 5 grudnia 2025
const TEAMS = [
  // Group A
  { name: "Meksyk", code: "MEX", group: "A", flagEmoji: "🇲🇽" },
  { name: "Republika Południowej Afryki", code: "RSA", group: "A", flagEmoji: "🇿🇦" },
  { name: "Korea Południowa", code: "KOR", group: "A", flagEmoji: "🇰🇷" },
  { name: "Czechy", code: "CZE", group: "A", flagEmoji: "🇨🇿" },
  // Group B
  { name: "Kanada", code: "CAN", group: "B", flagEmoji: "🇨🇦" },
  { name: "Bośnia i Hercegowina", code: "BIH", group: "B", flagEmoji: "🇧🇦" },
  { name: "Katar", code: "QAT", group: "B", flagEmoji: "🇶🇦" },
  { name: "Szwajcaria", code: "SUI", group: "B", flagEmoji: "🇨🇭" },
  // Group C
  { name: "Brazylia", code: "BRA", group: "C", flagEmoji: "🇧🇷" },
  { name: "Maroko", code: "MAR", group: "C", flagEmoji: "🇲🇦" },
  { name: "Haiti", code: "HAI", group: "C", flagEmoji: "🇭🇹" },
  { name: "Szkocja", code: "SCO", group: "C", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  { name: "Stany Zjednoczone", code: "USA", group: "D", flagEmoji: "🇺🇸" },
  { name: "Paragwaj", code: "PAR", group: "D", flagEmoji: "🇵🇾" },
  { name: "Australia", code: "AUS", group: "D", flagEmoji: "🇦🇺" },
  { name: "Turcja", code: "TUR", group: "D", flagEmoji: "🇹🇷" },
  // Group E
  { name: "Niemcy", code: "GER", group: "E", flagEmoji: "🇩🇪" },
  { name: "Curaçao", code: "CUW", group: "E", flagEmoji: "🇨🇼" },
  { name: "Wybrzeże Kości Słoniowej", code: "CIV", group: "E", flagEmoji: "🇨🇮" },
  { name: "Ekwador", code: "ECU", group: "E", flagEmoji: "🇪🇨" },
  // Group F
  { name: "Holandia", code: "NED", group: "F", flagEmoji: "🇳🇱" },
  { name: "Japonia", code: "JPN", group: "F", flagEmoji: "🇯🇵" },
  { name: "Szwecja", code: "SWE", group: "F", flagEmoji: "🇸🇪" },
  { name: "Tunezja", code: "TUN", group: "F", flagEmoji: "🇹🇳" },
  // Group G
  { name: "Belgia", code: "BEL", group: "G", flagEmoji: "🇧🇪" },
  { name: "Egipt", code: "EGY", group: "G", flagEmoji: "🇪🇬" },
  { name: "Iran", code: "IRN", group: "G", flagEmoji: "🇮🇷" },
  { name: "Nowa Zelandia", code: "NZL", group: "G", flagEmoji: "🇳🇿" },
  // Group H
  { name: "Hiszpania", code: "ESP", group: "H", flagEmoji: "🇪🇸" },
  { name: "Wyspy Zielonego Przylądka", code: "CPV", group: "H", flagEmoji: "🇨🇻" },
  { name: "Arabia Saudyjska", code: "KSA", group: "H", flagEmoji: "🇸🇦" },
  { name: "Urugwaj", code: "URU", group: "H", flagEmoji: "🇺🇾" },
  // Group I
  { name: "Francja", code: "FRA", group: "I", flagEmoji: "🇫🇷" },
  { name: "Senegal", code: "SEN", group: "I", flagEmoji: "🇸🇳" },
  { name: "Irak", code: "IRQ", group: "I", flagEmoji: "🇮🇶" },
  { name: "Norwegia", code: "NOR", group: "I", flagEmoji: "🇳🇴" },
  // Group J
  { name: "Argentyna", code: "ARG", group: "J", flagEmoji: "🇦🇷" },
  { name: "Algieria", code: "ALG", group: "J", flagEmoji: "🇩🇿" },
  { name: "Austria", code: "AUT", group: "J", flagEmoji: "🇦🇹" },
  { name: "Jordania", code: "JOR", group: "J", flagEmoji: "🇯🇴" },
  // Group K
  { name: "Portugalia", code: "POR", group: "K", flagEmoji: "🇵🇹" },
  { name: "DR Kongo", code: "COD", group: "K", flagEmoji: "🇨🇩" },
  { name: "Uzbekistan", code: "UZB", group: "K", flagEmoji: "🇺🇿" },
  { name: "Kolumbia", code: "COL", group: "K", flagEmoji: "🇨🇴" },
  // Group L
  { name: "Anglia", code: "ENG", group: "L", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Chorwacja", code: "CRO", group: "L", flagEmoji: "🇭🇷" },
  { name: "Ghana", code: "GHA", group: "L", flagEmoji: "🇬🇭" },
  { name: "Panama", code: "PAN", group: "L", flagEmoji: "🇵🇦" },
];

// ─── Group stage matches ───────────────────────────────────────────────────────
// Prawdziwe 72 mecze fazy grupowej wg harmonogramu FIFA (ogłoszonego 6 grudnia 2025).
// Numery meczów i godziny UTC zgodne z oficjalnym planem.

interface GroupMatchDef {
  groupLabel: string;
  home: string;
  away: string;
  kickoff: Date;
  matchNumber: number;
}

const kickoffForDb = (kickoffUtc: Date) =>
  new Date(kickoffUtc.getTime() + 2 * 60 * 60 * 1000);

const groupDefs: GroupMatchDef[] = [
  // ── Matchday 1 ─────────────────────────────────────────────────────
  // Group A
  { matchNumber:  1, home: "MEX", away: "RSA", kickoff: new Date("2026-06-11T19:00:00Z"), groupLabel: "Grupa A" },
  { matchNumber:  2, home: "KOR", away: "CZE", kickoff: new Date("2026-06-12T02:00:00Z"), groupLabel: "Grupa A" },
  // Group B
  { matchNumber:  3, home: "CAN", away: "BIH", kickoff: new Date("2026-06-12T19:00:00Z"), groupLabel: "Grupa B" },
  { matchNumber:  8, home: "QAT", away: "SUI", kickoff: new Date("2026-06-13T19:00:00Z"), groupLabel: "Grupa B" },
  // Group C
  { matchNumber:  7, home: "BRA", away: "MAR", kickoff: new Date("2026-06-13T22:00:00Z"), groupLabel: "Grupa C" },
  { matchNumber:  5, home: "HAI", away: "SCO", kickoff: new Date("2026-06-14T01:00:00Z"), groupLabel: "Grupa C" },
  // Group D
  { matchNumber:  4, home: "USA", away: "PAR", kickoff: new Date("2026-06-13T01:00:00Z"), groupLabel: "Grupa D" },
  { matchNumber:  6, home: "AUS", away: "TUR", kickoff: new Date("2026-06-14T04:00:00Z"), groupLabel: "Grupa D" },
  // Group E
  { matchNumber: 10, home: "GER", away: "CUW", kickoff: new Date("2026-06-14T17:00:00Z"), groupLabel: "Grupa E" },
  { matchNumber:  9, home: "CIV", away: "ECU", kickoff: new Date("2026-06-14T23:00:00Z"), groupLabel: "Grupa E" },
  // Group F
  { matchNumber: 11, home: "NED", away: "JPN", kickoff: new Date("2026-06-14T20:00:00Z"), groupLabel: "Grupa F" },
  { matchNumber: 12, home: "SWE", away: "TUN", kickoff: new Date("2026-06-15T02:00:00Z"), groupLabel: "Grupa F" },
  // Group G
  { matchNumber: 16, home: "BEL", away: "EGY", kickoff: new Date("2026-06-15T19:00:00Z"), groupLabel: "Grupa G" },
  { matchNumber: 15, home: "IRN", away: "NZL", kickoff: new Date("2026-06-16T01:00:00Z"), groupLabel: "Grupa G" },
  // Group H
  { matchNumber: 14, home: "ESP", away: "CPV", kickoff: new Date("2026-06-15T16:00:00Z"), groupLabel: "Grupa H" },
  { matchNumber: 13, home: "KSA", away: "URU", kickoff: new Date("2026-06-15T22:00:00Z"), groupLabel: "Grupa H" },
  // Group I
  { matchNumber: 17, home: "FRA", away: "SEN", kickoff: new Date("2026-06-16T19:00:00Z"), groupLabel: "Grupa I" },
  { matchNumber: 18, home: "IRQ", away: "NOR", kickoff: new Date("2026-06-16T22:00:00Z"), groupLabel: "Grupa I" },
  // Group J
  { matchNumber: 19, home: "ARG", away: "ALG", kickoff: new Date("2026-06-17T01:00:00Z"), groupLabel: "Grupa J" },
  { matchNumber: 20, home: "AUT", away: "JOR", kickoff: new Date("2026-06-17T04:00:00Z"), groupLabel: "Grupa J" },
  // Group K
  { matchNumber: 23, home: "POR", away: "COD", kickoff: new Date("2026-06-17T17:00:00Z"), groupLabel: "Grupa K" },
  { matchNumber: 24, home: "UZB", away: "COL", kickoff: new Date("2026-06-18T02:00:00Z"), groupLabel: "Grupa K" },
  // Group L
  { matchNumber: 22, home: "ENG", away: "CRO", kickoff: new Date("2026-06-17T20:00:00Z"), groupLabel: "Grupa L" },
  { matchNumber: 21, home: "GHA", away: "PAN", kickoff: new Date("2026-06-17T23:00:00Z"), groupLabel: "Grupa L" },

  // ── Matchday 2 ─────────────────────────────────────────────────────
  // Group A
  { matchNumber: 25, home: "CZE", away: "RSA", kickoff: new Date("2026-06-18T16:00:00Z"), groupLabel: "Grupa A" },
  { matchNumber: 28, home: "MEX", away: "KOR", kickoff: new Date("2026-06-19T01:00:00Z"), groupLabel: "Grupa A" },
  // Group B
  { matchNumber: 26, home: "SUI", away: "BIH", kickoff: new Date("2026-06-18T19:00:00Z"), groupLabel: "Grupa B" },
  { matchNumber: 27, home: "CAN", away: "QAT", kickoff: new Date("2026-06-18T22:00:00Z"), groupLabel: "Grupa B" },
  // Group C
  { matchNumber: 30, home: "SCO", away: "MAR", kickoff: new Date("2026-06-19T22:00:00Z"), groupLabel: "Grupa C" },
  { matchNumber: 29, home: "BRA", away: "HAI", kickoff: new Date("2026-06-20T00:30:00Z"), groupLabel: "Grupa C" },
  // Group D
  { matchNumber: 32, home: "USA", away: "AUS", kickoff: new Date("2026-06-19T19:00:00Z"), groupLabel: "Grupa D" },
  { matchNumber: 31, home: "TUR", away: "PAR", kickoff: new Date("2026-06-20T03:00:00Z"), groupLabel: "Grupa D" },
  // Group E
  { matchNumber: 33, home: "GER", away: "CIV", kickoff: new Date("2026-06-20T20:00:00Z"), groupLabel: "Grupa E" },
  { matchNumber: 34, home: "ECU", away: "CUW", kickoff: new Date("2026-06-21T00:00:00Z"), groupLabel: "Grupa E" },
  // Group F
  { matchNumber: 35, home: "NED", away: "SWE", kickoff: new Date("2026-06-20T17:00:00Z"), groupLabel: "Grupa F" },
  { matchNumber: 36, home: "TUN", away: "JPN", kickoff: new Date("2026-06-21T04:00:00Z"), groupLabel: "Grupa F" },
  // Group G
  { matchNumber: 39, home: "BEL", away: "IRN", kickoff: new Date("2026-06-21T19:00:00Z"), groupLabel: "Grupa G" },
  { matchNumber: 40, home: "NZL", away: "EGY", kickoff: new Date("2026-06-22T01:00:00Z"), groupLabel: "Grupa G" },
  // Group H
  { matchNumber: 38, home: "ESP", away: "KSA", kickoff: new Date("2026-06-21T16:00:00Z"), groupLabel: "Grupa H" },
  { matchNumber: 37, home: "URU", away: "CPV", kickoff: new Date("2026-06-21T22:00:00Z"), groupLabel: "Grupa H" },
  // Group I
  { matchNumber: 42, home: "FRA", away: "IRQ", kickoff: new Date("2026-06-22T21:00:00Z"), groupLabel: "Grupa I" },
  { matchNumber: 41, home: "NOR", away: "SEN", kickoff: new Date("2026-06-23T00:00:00Z"), groupLabel: "Grupa I" },
  // Group J
  { matchNumber: 43, home: "ARG", away: "AUT", kickoff: new Date("2026-06-22T17:00:00Z"), groupLabel: "Grupa J" },
  { matchNumber: 44, home: "JOR", away: "ALG", kickoff: new Date("2026-06-23T03:00:00Z"), groupLabel: "Grupa J" },
  // Group K
  { matchNumber: 47, home: "POR", away: "UZB", kickoff: new Date("2026-06-23T17:00:00Z"), groupLabel: "Grupa K" },
  { matchNumber: 48, home: "COL", away: "COD", kickoff: new Date("2026-06-24T02:00:00Z"), groupLabel: "Grupa K" },
  // Group L
  { matchNumber: 45, home: "ENG", away: "GHA", kickoff: new Date("2026-06-23T20:00:00Z"), groupLabel: "Grupa L" },
  { matchNumber: 46, home: "PAN", away: "CRO", kickoff: new Date("2026-06-23T23:00:00Z"), groupLabel: "Grupa L" },

  // ── Matchday 3 (simultaneous pairs) ────────────────────────────────
  // Group A
  { matchNumber: 53, home: "CZE", away: "MEX", kickoff: new Date("2026-06-25T01:00:00Z"), groupLabel: "Grupa A" },
  { matchNumber: 54, home: "RSA", away: "KOR", kickoff: new Date("2026-06-25T01:00:00Z"), groupLabel: "Grupa A" },
  // Group B
  { matchNumber: 51, home: "SUI", away: "CAN", kickoff: new Date("2026-06-24T19:00:00Z"), groupLabel: "Grupa B" },
  { matchNumber: 52, home: "BIH", away: "QAT", kickoff: new Date("2026-06-24T19:00:00Z"), groupLabel: "Grupa B" },
  // Group C
  { matchNumber: 49, home: "SCO", away: "BRA", kickoff: new Date("2026-06-24T22:00:00Z"), groupLabel: "Grupa C" },
  { matchNumber: 50, home: "MAR", away: "HAI", kickoff: new Date("2026-06-24T22:00:00Z"), groupLabel: "Grupa C" },
  // Group D
  { matchNumber: 59, home: "TUR", away: "USA", kickoff: new Date("2026-06-26T02:00:00Z"), groupLabel: "Grupa D" },
  { matchNumber: 60, home: "PAR", away: "AUS", kickoff: new Date("2026-06-26T02:00:00Z"), groupLabel: "Grupa D" },
  // Group E
  { matchNumber: 55, home: "CUW", away: "CIV", kickoff: new Date("2026-06-25T20:00:00Z"), groupLabel: "Grupa E" },
  { matchNumber: 56, home: "ECU", away: "GER", kickoff: new Date("2026-06-25T20:00:00Z"), groupLabel: "Grupa E" },
  // Group F
  { matchNumber: 57, home: "JPN", away: "SWE", kickoff: new Date("2026-06-25T23:00:00Z"), groupLabel: "Grupa F" },
  { matchNumber: 58, home: "TUN", away: "NED", kickoff: new Date("2026-06-25T23:00:00Z"), groupLabel: "Grupa F" },
  // Group G
  { matchNumber: 63, home: "EGY", away: "IRN", kickoff: new Date("2026-06-27T03:00:00Z"), groupLabel: "Grupa G" },
  { matchNumber: 64, home: "NZL", away: "BEL", kickoff: new Date("2026-06-27T03:00:00Z"), groupLabel: "Grupa G" },
  // Group H
  { matchNumber: 65, home: "CPV", away: "KSA", kickoff: new Date("2026-06-27T00:00:00Z"), groupLabel: "Grupa H" },
  { matchNumber: 66, home: "URU", away: "ESP", kickoff: new Date("2026-06-27T00:00:00Z"), groupLabel: "Grupa H" },
  // Group I
  { matchNumber: 61, home: "NOR", away: "FRA", kickoff: new Date("2026-06-26T19:00:00Z"), groupLabel: "Grupa I" },
  { matchNumber: 62, home: "SEN", away: "IRQ", kickoff: new Date("2026-06-26T19:00:00Z"), groupLabel: "Grupa I" },
  // Group J
  { matchNumber: 69, home: "ALG", away: "AUT", kickoff: new Date("2026-06-28T02:00:00Z"), groupLabel: "Grupa J" },
  { matchNumber: 70, home: "JOR", away: "ARG", kickoff: new Date("2026-06-28T02:00:00Z"), groupLabel: "Grupa J" },
  // Group K
  { matchNumber: 71, home: "COL", away: "POR", kickoff: new Date("2026-06-27T23:30:00Z"), groupLabel: "Grupa K" },
  { matchNumber: 72, home: "COD", away: "UZB", kickoff: new Date("2026-06-27T23:30:00Z"), groupLabel: "Grupa K" },
  // Group L
  { matchNumber: 67, home: "PAN", away: "ENG", kickoff: new Date("2026-06-27T21:00:00Z"), groupLabel: "Grupa L" },
  { matchNumber: 68, home: "CRO", away: "GHA", kickoff: new Date("2026-06-27T21:00:00Z"), groupLabel: "Grupa L" },
];

// ─── Knockout matches (TBD teams) ─────────────────────────────────────────────
// Godziny UTC odpowiadają godzinom transmisji TVP (czas polski, CEST).
const knockoutMatches = [
  // Round of 32 (16 matches)
  { matchNumber: 73, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-28T19:00:00Z"), groupLabel: null },
  { matchNumber: 74, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-29T17:00:00Z"), groupLabel: null },
  { matchNumber: 75, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-29T20:30:00Z"), groupLabel: null },
  { matchNumber: 76, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-30T01:00:00Z"), groupLabel: null },
  { matchNumber: 77, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-30T17:00:00Z"), groupLabel: null },
  { matchNumber: 78, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-06-30T21:00:00Z"), groupLabel: null },
  { matchNumber: 79, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-01T01:00:00Z"), groupLabel: null },
  { matchNumber: 80, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-01T16:00:00Z"), groupLabel: null },
  { matchNumber: 81, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-01T20:00:00Z"), groupLabel: null },
  { matchNumber: 82, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-02T00:00:00Z"), groupLabel: null },
  { matchNumber: 83, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-02T19:00:00Z"), groupLabel: null },
  { matchNumber: 84, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-02T23:00:00Z"), groupLabel: null },
  { matchNumber: 85, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-03T03:00:00Z"), groupLabel: null },
  { matchNumber: 86, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-03T18:00:00Z"), groupLabel: null },
  { matchNumber: 87, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-03T22:00:00Z"), groupLabel: null },
  { matchNumber: 88, stage: "ROUND_OF_32" as MatchStage, kickoff: new Date("2026-07-04T01:30:00Z"), groupLabel: null },

  // Round of 16 (8 matches)
  { matchNumber: 89, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-04T17:00:00Z"), groupLabel: null },
  { matchNumber: 90, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-04T21:00:00Z"), groupLabel: null },
  { matchNumber: 91, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-05T20:00:00Z"), groupLabel: null },
  { matchNumber: 92, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-06T00:00:00Z"), groupLabel: null },
  { matchNumber: 93, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-06T19:00:00Z"), groupLabel: null },
  { matchNumber: 94, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-07T00:00:00Z"), groupLabel: null },
  { matchNumber: 95, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-07T16:00:00Z"), groupLabel: null },
  { matchNumber: 96, stage: "ROUND_OF_16" as MatchStage, kickoff: new Date("2026-07-07T20:00:00Z"), groupLabel: null },

  // Quarter-finals (4 matches)
  { matchNumber: 97, stage: "QUARTER_FINAL" as MatchStage, kickoff: new Date("2026-07-09T20:00:00Z"), groupLabel: null },
  { matchNumber: 98, stage: "QUARTER_FINAL" as MatchStage, kickoff: new Date("2026-07-10T19:00:00Z"), groupLabel: null },
  { matchNumber: 99, stage: "QUARTER_FINAL" as MatchStage, kickoff: new Date("2026-07-11T21:00:00Z"), groupLabel: null },
  { matchNumber: 100, stage: "QUARTER_FINAL" as MatchStage, kickoff: new Date("2026-07-12T01:00:00Z"), groupLabel: null },

  // Semi-finals (2 matches)
  { matchNumber: 101, stage: "SEMI_FINAL" as MatchStage, kickoff: new Date("2026-07-14T19:00:00Z"), groupLabel: null },
  { matchNumber: 102, stage: "SEMI_FINAL" as MatchStage, kickoff: new Date("2026-07-15T19:00:00Z"), groupLabel: null },

  // 3rd place and final
  { matchNumber: 103, stage: "THIRD_PLACE" as MatchStage, kickoff: new Date("2026-07-18T21:00:00Z"), groupLabel: null },
  { matchNumber: 104, stage: "FINAL" as MatchStage, kickoff: new Date("2026-07-19T19:00:00Z"), groupLabel: null },
];

async function main() {
  console.log("🌱 Seeding database…");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@typownik.pl" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@typownik.pl",
      passwordHash: adminPassword,
      passwordHint: "ostatnie 3 znaki: 123",
      isAdmin: true,
    },
  });
  console.log(`✓ Admin: admin@typownik.pl / admin123`);

  // Create test user
  const testPassword = await bcrypt.hash("test123", 12);
  await prisma.user.upsert({
    where: { email: "test@typownik.pl" },
    update: {},
    create: {
      name: "Tester",
      email: "test@typownik.pl",
      passwordHash: testPassword,
      passwordHint: "ostatnie 3 znaki: 123",
      isAdmin: false,
    },
  });
  console.log(`✓ Test: test@typownik.pl / test123`);

  // Create some invite codes
  const inviteCodes = ["KICK2026", "GOLAZO26", "MUNDIAL1", "WORLDCUP", "POLSKAOK"];
  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  console.log(`✓ Invite codes: ${inviteCodes.join(", ")}`);

  // Create teams
  const teamMap = new Map<string, string>(); // code -> id
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
    teamMap.set(t.code, team.id);
  }
  console.log(`✓ ${TEAMS.length} drużyn`);

  // Create group stage matches
  for (const m of groupDefs) {
    await prisma.match.upsert({
      where: { matchNumber: m.matchNumber },
      update: {
        kickoff: kickoffForDb(m.kickoff),
      },
      create: {
        homeTeamId: teamMap.get(m.home)!,
        awayTeamId: teamMap.get(m.away)!,
        kickoff: kickoffForDb(m.kickoff),
        stage: "GROUP",
        groupLabel: m.groupLabel,
        matchNumber: m.matchNumber,
      },
    });
  }
  console.log(`✓ ${groupDefs.length} meczów fazy grupowej`);

  // Create knockout matches (no teams yet — TBD)
  for (const m of knockoutMatches) {
    await prisma.match.upsert({
      where: { matchNumber: m.matchNumber },
      update: {
        kickoff: kickoffForDb(m.kickoff),
      },
      create: {
        kickoff: kickoffForDb(m.kickoff),
        stage: m.stage,
        groupLabel: m.groupLabel,
        matchNumber: m.matchNumber,
      },
    });
  }
  console.log(`✓ ${knockoutMatches.length} meczów fazy pucharowej`);

  console.log("✅ Seeding zakończone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
