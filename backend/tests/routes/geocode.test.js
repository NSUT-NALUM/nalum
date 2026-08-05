const express = require("express");
const request = require("supertest");

jest.mock("axios");

// protect is an auth middleware; bypass it in route-level tests
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => next(),
}));

const axios = require("axios");
const geocodeRoutes = require("../../routes/geocode");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/geocode", geocodeRoutes);
  return app;
};

describe("geocode routes", () => {
  let app;

  beforeEach(() => {
    jest.resetAllMocks();
    app = buildApp();
  });

  describe("POST /api/geocode/reverse", () => {
    it("returns 400 when lat/lng are missing", async () => {
      const res = await request(app).post("/api/geocode/reverse").send({});
      expect(res.status).toBe(400);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("returns 400 when lat/lng are not valid numbers", async () => {
      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: "abc", lng: 77.209 });
      expect(res.status).toBe(400);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("rejects null and empty-string coordinates (Number(null) is 0)", async () => {
      const nullRes = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: null, lng: null });
      expect(nullRes.status).toBe(400);

      const emptyRes = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: "", lng: "" });
      expect(emptyRes.status).toBe(400);

      expect(axios.get).not.toHaveBeenCalled();
    });

    it("returns city and country on success", async () => {
      axios.get.mockResolvedValue({
        data: { address: { city: "Delhi", country: "India" } },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.6139, lng: 77.209 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ city: "Delhi", country: "India" });
    });

    it("returns empty strings when reverse response has no address", async () => {
      axios.get.mockResolvedValue({ data: {} });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 0, lng: 0 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ city: "", country: "" });
    });
  });

  describe("POST /api/geocode/search", () => {
    it("returns 400 when city or country is missing", async () => {
      const res = await request(app)
        .post("/api/geocode/search")
        .send({ city: "Delhi" });
      expect(res.status).toBe(400);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("returns lat/lng as numbers on success", async () => {
      axios.get.mockResolvedValue({ data: [{ lat: "28.6139", lon: "77.209" }] });

      const res = await request(app)
        .post("/api/geocode/search")
        .send({ city: "Delhi", country: "India" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ lat: 28.6139, lng: 77.209 });
    });

    it("returns null lat/lng when no result is found", async () => {
      axios.get.mockResolvedValue({ data: [] });

      const res = await request(app)
        .post("/api/geocode/search")
        .send({ city: "Atlantis", country: "Nowhere" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ lat: null, lng: null });
    });
  });
});
