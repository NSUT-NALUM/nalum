const axios = require("axios");

jest.mock("axios");
jest.mock("../../config/redis.config", () => ({
  getRedisClient: jest.fn(),
}));
jest.mock("../../models/user/profile.model", () => ({
  findOneAndUpdate: jest.fn(),
}));

const { getRedisClient } = require("../../config/redis.config");
const Profile = require("../../models/user/profile.model");
const geocodingQueue = require("../../services/geocodingQueue");

describe("Geocoding Queue Service", () => {
  let mockRedis;

  beforeEach(() => {
    jest.resetAllMocks();

    mockRedis = {
      rPush: jest.fn().mockResolvedValue(1),
      lPop: jest.fn().mockResolvedValue(null),
      lMove: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      get: jest.fn().mockResolvedValue(null),
      lRem: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      lLen: jest.fn().mockResolvedValue(0),
      incr: jest.fn().mockResolvedValue(1),
    };

    getRedisClient.mockReturnValue(mockRedis);
  });

  afterEach(() => {
    geocodingQueue.stopProcessing();
  });

  describe("addToQueue", () => {
    it("pushes serialized item to geocoding:queue in Redis", async () => {
      await geocodingQueue.addToQueue("user123", "Delhi", "India");

      expect(mockRedis.rPush).toHaveBeenCalledTimes(1);
      const [queueKey, itemStr] = mockRedis.rPush.mock.calls[0];
      expect(queueKey).toBe("geocoding:queue");

      const item = JSON.parse(itemStr);
      expect(item.userId).toBe("user123");
      expect(item.city).toBe("Delhi");
      expect(item.country).toBe("India");
    });
  });

  describe("getQueueStatus", () => {
    it("returns correct queue length and processing status", async () => {
      mockRedis.lLen.mockImplementation((key) => {
        if (key === "geocoding:queue") return Promise.resolve(5);
        if (key === "geocoding:in_progress") return Promise.resolve(0);
        return Promise.resolve(0);
      });
      mockRedis.get.mockImplementation((key) => {
        if (key === "geocoding:error_count") return Promise.resolve("0");
        if (key === "geocoding:processing") return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const status = await geocodingQueue.getQueueStatus();

      expect(status).toEqual({
        queueLength: 5,
        inProgressLength: 0,
        errorCount: 0,
        isProcessing: false,
        currentlyProcessing: null,
      });
    });
  });

  describe("processNextItem pacing & execution", () => {
    it("processes item, calls Nominatim for non-canonical location, updates Profile, and clears processing flag", async () => {
      const queueItem = JSON.stringify({
        userId: "user123",
        city: "Oslo",
        country: "Norway",
        attempts: 1,
        addedAt: Date.now(),
      });

      mockRedis.lMove.mockResolvedValue(queueItem);
      axios.get.mockResolvedValue({
        data: [{ lat: "59.9139", lon: "10.7522" }],
      });
      Profile.findOneAndUpdate.mockResolvedValue({});

      await geocodingQueue._internal.processNextItem();

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search",
        expect.objectContaining({
          params: { q: "Oslo, Norway", format: "json", limit: 1 },
        })
      );
      expect(Profile.findOneAndUpdate).toHaveBeenCalledWith(
        { user: "user123" },
        { "location.lat": 59.9139, "location.lng": 10.7522 }
      );
      expect(mockRedis.lRem).toHaveBeenCalledWith("geocoding:in_progress", 1, queueItem);
    });
  });
});
