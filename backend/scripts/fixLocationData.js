/**
 * Migration Script: Fix & Normalize Profile Location Data
 *
 * Normalizes city/country names (e.g. delhi/bangalore/gurgaon -> new delhi/bengaluru/gurugram),
 * corrects corrupted coordinates using canonical lookup or distance thresholding, and clears stale Redis cache.
 *
 * Usage:
 *   node scripts/fixLocationData.js            (applies changes)
 *   node scripts/fixLocationData.js --dry-run  (preview only)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nalum";

const {
  normalizeCityAndCountry,
  getCanonicalLocation,
  haversineDistanceKm,
} = require("../config/canonicalCities");
const { invalidateAlumniMapCache } = require("../config/cacheKeys");

const isDryRun = process.argv.includes("--dry-run");

async function fixLocationData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB ${isDryRun ? "[DRY RUN MODE]" : ""}\n`);

    const db = mongoose.connection.db;
    const profilesCollection = db.collection("profiles");

    const profiles = await profilesCollection
      .find({
        "location.city": { $exists: true, $ne: "" },
      })
      .toArray();

    console.log(`Found ${profiles.length} profiles with location data.\n`);

    let updatedCount = 0;

    for (const profile of profiles) {
      const rawCity = profile.location ? profile.location.city : "";
      const rawCountry = profile.location ? profile.location.country : "";
      const currentLat = profile.location ? profile.location.lat : null;
      const currentLng = profile.location ? profile.location.lng : null;

      const norm = normalizeCityAndCountry(rawCity, rawCountry);
      const canonical = getCanonicalLocation(rawCity, rawCountry);

      let targetCity = norm.displayCity.toLowerCase();
      let targetCountry = norm.displayCountry.toLowerCase();
      let targetLat = currentLat;
      let targetLng = currentLng;
      let needsUpdate = false;
      let reason = [];

      // Check city/country string normalization
      if (rawCity !== targetCity) {
        needsUpdate = true;
        reason.push(`city: "${rawCity}" -> "${targetCity}"`);
      }
      if (rawCountry !== targetCountry) {
        needsUpdate = true;
        reason.push(`country: "${rawCountry}" -> "${targetCountry}"`);
      }

      // Check coordinates against canonical
      if (canonical.isCanonical) {
        const dist =
          currentLat != null && currentLng != null
            ? haversineDistanceKm(currentLat, currentLng, canonical.lat, canonical.lng)
            : Infinity;

        if (dist > 50 || currentLat == null || currentLng == null) {
          needsUpdate = true;
          targetLat = canonical.lat;
          targetLng = canonical.lng;
          reason.push(
            `coords: (${currentLat}, ${currentLng}) -> (${canonical.lat}, ${canonical.lng}) [${dist === Infinity ? "missing" : dist.toFixed(1) + "km off"}]`
          );
        }
      }

      if (needsUpdate) {
        console.log(`⚡ Profile ${profile._id}:`);
        console.log(`   Reasons: ${reason.join(" | ")}`);

        if (!isDryRun) {
          await profilesCollection.updateOne(
            { _id: profile._id },
            {
              $set: {
                "location.city": targetCity,
                "location.country": targetCountry,
                "location.lat": targetLat,
                "location.lng": targetLng,
              },
            }
          );
        }
        updatedCount++;
      }
    }

    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`${isDryRun ? "Would update" : "Successfully updated"}: ${updatedCount} / ${profiles.length} profiles.`);

    if (!isDryRun && updatedCount > 0) {
      await invalidateAlumniMapCache();
      console.log("Cleared Redis alumni-map cache.");
    }

    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

fixLocationData();
