import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getProfileFromAccountId,
  getProfileFromUserName,
  getUserTitles,
  getUserPlayedGames,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
  makeUniversalSearch,
} from "psn-api";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, ".auth.json");

const app = express();
app.use(cors());
app.use(express.json());

function loadCachedAuth() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
      if (data && data.accessToken && data.expiresAt > Date.now()) {
        console.log(`[PSN] Restored cached auth session for account: ${data.onlineId || "User"} (${data.accountId})`);
        return data;
      }
    }
  } catch (e) {
    console.warn("[PSN] Could not restore cached auth:", e.message);
  }
  return { accessToken: null, expiresAt: null, accountId: null, onlineId: null };
}

function saveCachedAuth(state) {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.warn("[PSN] Failed to save cached auth:", e.message);
  }
}

function clearCachedAuth() {
  try {
    if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE);
  } catch (e) {}
}

let authState = loadCachedAuth();

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const decoded = Buffer.from(parts[1], "base64").toString("utf8");
      return JSON.parse(decoded);
    }
  } catch (e) {
    console.error("[PSN] Failed to decode JWT:", e.message);
  }
  return null;
}

function parseIsoDurationToHours(isoDuration) {
  if (!isoDuration || typeof isoDuration !== "string") return 0;
  // Parse e.g. "PT228H56M33S", "PT12H", "PT45M"
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minsMatch = isoDuration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
  return Math.round((hours + mins / 60) * 10) / 10;
}

function cleanTitleForMatching(title) {
  if (!title) return "";
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .replace(/[’']/g, "")
    .replace(/[®™©]/g, "")
    .replace(/\(.*?\)/g, "") // remove parentheticals like (PS5)
    .replace(/ps[45]/gi, "") // remove PS4/PS5 tags
    .replace(/[^a-z0-9]/gi, "") // keep alphanumeric only
    .toLowerCase()
    .trim();
}

// ──────────────── AUTH ────────────────

app.get("/api/psn/auth", (req, res) => {
  const isAuthenticated = authState.accessToken && Date.now() < authState.expiresAt;
  res.json({
    message: "PSN Auth endpoint ready. Send a POST request with { npsso: 'your_token' } from the GameTracker UI.",
    authenticated: !!isAuthenticated,
    accountId: authState.accountId,
    onlineId: authState.onlineId,
  });
});

app.post("/api/psn/auth", async (req, res) => {
  try {
    let { npsso } = req.body;
    if (!npsso || typeof npsso !== "string") {
      return res.status(400).json({ error: "NPSSO token is required" });
    }

    npsso = npsso.trim();
    console.log(`[PSN] Initiating auth with NPSSO token (length: ${npsso.length})...`);

    const accessCode = await exchangeNpssoForCode(npsso);
    console.log("[PSN] Obtained access code, exchanging for authorization tokens...");
    const authorization = await exchangeCodeForAccessToken(accessCode);

    authState = {
      accessToken: authorization,
      expiresAt: Date.now() + (authorization.expiresIn || 3600) * 1000,
      accountId: null,
      onlineId: null,
    };

    // Extract accountId from idToken or accessToken JWT
    const idPayload = decodeJwtPayload(authorization.idToken) || decodeJwtPayload(authorization.accessToken);
    if (idPayload) {
      authState.accountId = idPayload.account_id || idPayload.sub || null;
      authState.onlineId = idPayload.online_id || null;
      console.log(`[PSN] Extracted from JWT: accountId=${authState.accountId}, onlineId=${authState.onlineId}`);
    }

    // Call getProfileFromUserName("me") for profile details
    let profileData = null;
    try {
      const resp = await getProfileFromUserName(authorization, "me");
      profileData = resp?.profile || resp;
      if (profileData?.accountId) authState.accountId = profileData.accountId;
      if (profileData?.onlineId) authState.onlineId = profileData.onlineId;
    } catch (err) {
      console.warn("[PSN] getProfileFromUserName('me') warning:", err.message);
    }

    saveCachedAuth(authState);
    console.log(`[PSN] Successfully connected PSN account: ${authState.onlineId || "Connected User"} (${authState.accountId})`);

    res.json({
      success: true,
      profile: {
        accountId: authState.accountId,
        onlineId: authState.onlineId || "PlayStation Player",
        aboutMe: profileData?.aboutMe || "",
        avatarUrl: profileData?.avatarUrls?.[0]?.avatarUrl || null,
        languages: profileData?.languagesUsed || [],
        isPlus: profileData?.plus === 1,
      },
    });
  } catch (err) {
    console.error("[PSN] Auth error:", err);
    res.status(401).json({
      error: "Authentication failed. Make sure your NPSSO token is valid, fresh, and not expired.",
      details: err.message || String(err),
    });
  }
});

app.get("/api/psn/auth/status", (req, res) => {
  const isAuthenticated = authState.accessToken && Date.now() < authState.expiresAt;
  res.json({
    authenticated: !!isAuthenticated,
    accountId: authState.accountId,
    onlineId: authState.onlineId,
  });
});

app.post("/api/psn/auth/logout", (req, res) => {
  console.log("[PSN] User logged out / disconnected.");
  clearCachedAuth();
  authState = { accessToken: null, expiresAt: null, accountId: null, onlineId: null };
  res.json({ success: true, message: "Disconnected successfully" });
});

// ──────────────── PROFILE ────────────────

app.get("/api/psn/profile", async (req, res) => {
  try {
    if (!authState.accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let profileData = null;
    try {
      const resp = await getProfileFromUserName(authState.accessToken, "me");
      profileData = resp?.profile || resp;
    } catch (err) {
      console.warn("[PSN] getProfileFromUserName fallback error:", err.message);
    }

    const onlineId = profileData?.onlineId || authState.onlineId || "PlayStation Player";
    const accountId = profileData?.accountId || authState.accountId;

    // Extract rich user identity from idToken payload
    const idPayload = decodeJwtPayload(authState.accessToken?.idToken) || decodeJwtPayload(authState.accessToken?.accessToken);
    const birthdate = idPayload?.birthdate || null;
    const age = idPayload?.age || null;
    const countryCode = idPayload?.legal_country || profileData?.country || null;
    let countryName = countryCode;
    try {
      if (countryCode) {
        countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode;
      }
    } catch {}

    const firstName = profileData?.personalDetail?.firstName || idPayload?.given_name || "";
    const lastName = profileData?.personalDetail?.lastName || idPayload?.family_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

    const trophySummary = profileData?.trophySummary || {
      level: 1,
      progress: 0,
      earnedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
    };

    res.json({
      onlineId,
      accountId,
      fullName,
      firstName,
      lastName,
      dob: birthdate,
      age,
      country: countryName,
      countryCode,
      locale: idPayload?.locale || profileData?.languagesUsed?.[0] || null,
      aboutMe: profileData?.aboutMe || "",
      avatarUrl: profileData?.avatarUrls?.[0]?.avatarUrl || null,
      trophySummary: {
        level: trophySummary.level || 1,
        progress: trophySummary.progress || 0,
        earnedTrophies: trophySummary.earnedTrophies || { bronze: 0, silver: 0, gold: 0, platinum: 0 },
      },
      isPlus: profileData?.plus === 1,
      languages: profileData?.languagesUsed || [],
      personalDetail: profileData?.personalDetail || (fullName ? { firstName, lastName } : null),
    });
  } catch (err) {
    console.error("[PSN] Profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile", details: err.message });
  }
});

// ──────────────── GAMES (Titles + Playtime) ────────────────

app.get("/api/psn/games", async (req, res) => {
  try {
    if (!authState.accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const accountId = authState.accountId || "me";

    console.log(`[PSN] Fetching user titles for account ${accountId} (offset: ${offset}, limit: ${limit})...`);

    const response = await getUserTitles(
      authState.accessToken,
      accountId,
      { limit, offset }
    );

    // Fetch user played games to retrieve playtime durations
    const playtimeExact = new Map();
    const playtimeClean = new Map();
    try {
      console.log(`[PSN] Calling getUserPlayedGames for ${accountId}...`);
      const played = await getUserPlayedGames(authState.accessToken, accountId, { limit: 100 });
      const titles = played?.titles || [];
      console.log(`[PSN] getUserPlayedGames returned ${titles.length} titles`);

      for (const t of titles) {
        const hours = parseIsoDurationToHours(t.playDuration);
        console.log(`[PSN] Title played: "${t.name}" -> duration: "${t.playDuration}" (${hours}h)`);

        if (t.name) {
          playtimeExact.set(t.name.toLowerCase().trim(), hours);
          playtimeClean.set(cleanTitleForMatching(t.name), hours);
        }
        if (t.localizedName) {
          playtimeExact.set(t.localizedName.toLowerCase().trim(), hours);
          playtimeClean.set(cleanTitleForMatching(t.localizedName), hours);
        }
        if (t.concept?.name) {
          playtimeExact.set(t.concept.name.toLowerCase().trim(), hours);
          playtimeClean.set(cleanTitleForMatching(t.concept.name), hours);
        }
      }
    } catch (err) {
      console.warn("[PSN] Playtime fetch warning:", err.message);
    }

    const games = (response?.trophyTitles || []).map((title) => {
      const rawName = (title.trophyTitleName || "").toLowerCase().trim();
      const cleanKey = cleanTitleForMatching(title.trophyTitleName);

      // Match exact or fuzzy
      let hoursPlayed = playtimeExact.get(rawName) ?? playtimeClean.get(cleanKey) ?? 0;

      // Partial fuzzy search if not matched
      if (hoursPlayed === 0 && cleanKey.length > 3) {
        for (const [key, val] of playtimeClean.entries()) {
          if (key.includes(cleanKey) || cleanKey.includes(key)) {
            hoursPlayed = val;
            break;
          }
        }
      }

      return {
        npCommunicationId: title.npCommunicationId,
        npServiceName: title.npServiceName,
        trophySetVersion: title.trophySetVersion,
        title: title.trophyTitleName,
        detail: title.trophyTitleDetail,
        iconUrl: title.trophyTitleIconUrl,
        platform: title.trophyTitlePlatform,
        hasTrophyGroups: title.hasTrophyGroups,
        definedTrophies: title.definedTrophies || { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        earnedTrophies: title.earnedTrophies || { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        progress: title.progress || 0,
        hoursPlayed: hoursPlayed,
        hiddenFlag: title.hiddenFlag,
        lastUpdatedDateTime: title.lastUpdatedDateTime,
      };
    });

    console.log(`[PSN] Returning ${games.length} titles to client`);

    res.json({
      totalItemCount: response?.totalItemCount ?? games.length,
      games,
    });
  } catch (err) {
    console.error("[PSN] Games error:", err.message);
    res.status(500).json({ error: "Failed to fetch games", details: err.message });
  }
});

// ──────────────── TROPHIES for a game ────────────────

app.get("/api/psn/games/:npCommunicationId/trophies", async (req, res) => {
  try {
    if (!authState.accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { npCommunicationId } = req.params;
    const npServiceName = req.query.npServiceName || "trophy";
    const accountId = authState.accountId || "me";

    console.log(`[PSN] Fetching trophies for game ${npCommunicationId}...`);

    const trophyList = await getTitleTrophies(
      authState.accessToken,
      npCommunicationId,
      "all",
      { npServiceName }
    );

    let userTrophies = { trophies: [] };
    try {
      userTrophies = await getUserTrophiesEarnedForTitle(
        authState.accessToken,
        accountId,
        npCommunicationId,
        "all",
        { npServiceName }
      );
    } catch (e) {
      console.warn(`[PSN] Could not get earned trophies for ${npCommunicationId}:`, e.message);
    }

    const mergedTrophies = (trophyList?.trophies || []).map((trophy) => {
      const earned = (userTrophies?.trophies || []).find(
        (ut) => ut.trophyId === trophy.trophyId
      );
      return {
        ...trophy,
        earned: earned?.earned || false,
        earnedDateTime: earned?.earnedDateTime || null,
        progress: earned?.progress || null,
        progressRate: earned?.progressRate || null,
      };
    });

    res.json({
      totalItemCount: trophyList?.totalItemCount ?? mergedTrophies.length,
      trophies: mergedTrophies,
    });
  } catch (err) {
    console.error("[PSN] Trophies error:", err.message);
    res.status(500).json({ error: "Failed to fetch trophies", details: err.message });
  }
});

// ──────────────── START ────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🎮 PSN API Proxy running at http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   POST /api/psn/auth         — Authenticate with NPSSO token`);
  console.log(`   GET  /api/psn/auth/status   — Check auth status`);
  console.log(`   POST /api/psn/auth/logout   — Disconnect account`);
  console.log(`   GET  /api/psn/profile       — Get PSN profile`);
  console.log(`   GET  /api/psn/games         — Get game library & playtime`);
  console.log(`   GET  /api/psn/games/:id/trophies — Get trophies for a game\n`);
});
