const {
  normalizeCityAndCountry,
  getCanonicalLocation,
  haversineDistanceKm,
} = require("../config/canonicalCities");

describe("canonicalCities module", () => {
  test("normalizes city aliases correctly (delhi / delhi ncr -> new delhi)", () => {
    const res1 = normalizeCityAndCountry("delhi", "india");
    expect(res1.normalizedCity).toBe("new delhi");
    expect(res1.displayCity).toBe("New Delhi");

    const res2 = normalizeCityAndCountry("delhi ncr", "india");
    expect(res2.normalizedCity).toBe("new delhi");
  });

  test("normalizes city aliases (bangalore -> bengaluru, gurgaon -> gurugram)", () => {
    const res1 = normalizeCityAndCountry("bangalore", "india");
    expect(res1.normalizedCity).toBe("bengaluru");
    expect(res1.displayCity).toBe("Bengaluru");

    const res2 = normalizeCityAndCountry("gurgaon", "india");
    expect(res2.normalizedCity).toBe("gurugram");
    expect(res2.displayCity).toBe("Gurugram");
  });

  test("normalizes country aliases (usa -> united states, uk -> united kingdom)", () => {
    const res1 = normalizeCityAndCountry("new york", "usa");
    expect(res1.normalizedCountry).toBe("united states");
    expect(res1.displayCountry).toBe("United States");

    const res2 = normalizeCityAndCountry("london", "uk");
    expect(res2.normalizedCountry).toBe("united kingdom");
    expect(res2.displayCountry).toBe("United Kingdom");
  });

  test("retrieves canonical coordinates for known cities", () => {
    const delhi = getCanonicalLocation("delhi", "india");
    expect(delhi.isCanonical).toBe(true);
    expect(delhi.lat).toBe(28.6139);
    expect(delhi.lng).toBe(77.209);

    const bangalore = getCanonicalLocation("banglore", "india");
    expect(bangalore.isCanonical).toBe(true);
    expect(bangalore.lat).toBe(12.9716);
    expect(bangalore.lng).toBe(77.5946);
  });

  test("calculates Haversine distance in kilometers accurately", () => {
    // Delhi (28.6139, 77.209) to Mumbai (19.076, 72.8777) ~ 1140 km
    const dist = haversineDistanceKm(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });
});
