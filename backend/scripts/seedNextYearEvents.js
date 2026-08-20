/**
 * Script to seed events for next year (2027) and past expired events into MongoDB.
 * Usage: node backend/scripts/seedNextYearEvents.js
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });

const Event = require("../models/admin/event.model");
const User = require("../models/user/user.model");

const eventsToSeed = [
  // Upcoming Events for Next Year (2027)
  {
    title: "NSUT Global Alumni Summit 2027",
    description: "Annual grand summit bringing together NSUT alumni from across the world for keynotes, panel discussions, and networking.",
    event_date: new Date("2027-02-20T10:00:00.000Z"),
    event_time: "10:00 AM",
    location: "Main Campus Auditorium & Hybrid Online",
    event_type: "conference",
    status: "approved",
    max_participants: 500,
    registration_link: "https://nsut-alumni.ac.in/summit2027",
    likes: 42,
  },
  {
    title: "AI & Deep Tech Leadership Conclave 2027",
    description: "Industry leaders and alumni research pioneers discuss breakthroughs in generative AI, robotics, and quantum computing.",
    event_date: new Date("2027-04-15T09:30:00.000Z"),
    event_time: "09:30 AM",
    location: "NSUT Innovation & Incubation Center",
    event_type: "seminar",
    status: "approved",
    max_participants: 250,
    registration_link: "https://nsut-alumni.ac.in/ai-conclave-2027",
    likes: 38,
  },
  {
    title: "Alumni Founder & Startup Pitch Fest 2027",
    description: "Alumni-led startups pitch to venture capitalists, angel investors, and seasoned industry mentors.",
    event_date: new Date("2027-06-10T11:00:00.000Z"),
    event_time: "11:00 AM",
    location: "NSUT Auditorium Hall B",
    event_type: "workshop",
    status: "approved",
    max_participants: 200,
    registration_link: "https://nsut-alumni.ac.in/pitchfest2027",
    likes: 29,
  },
  {
    title: "Spring Alumni Mentorship & Career Webinar 2027",
    description: "Exclusive interactive session for graduating students to get 1-on-1 career guidance and mock interview strategies.",
    event_date: new Date("2027-08-05T17:00:00.000Z"),
    event_time: "05:00 PM",
    location: "Online - Google Meet",
    event_type: "webinar",
    status: "approved",
    max_participants: 300,
    registration_link: "https://nsut-alumni.ac.in/mentorship-2027",
    likes: 19,
  },
  {
    title: "NSUT Winter Alumni Gala & Awards Night 2027",
    description: "Celebrating distinguished alumni achievements with an evening gala dinner, cultural performances, and awards.",
    event_date: new Date("2027-11-18T18:30:00.000Z"),
    event_time: "06:30 PM",
    location: "The Oberoi Grand Ballroom, New Delhi",
    event_type: "meetup",
    status: "approved",
    max_participants: 400,
    registration_link: "https://nsut-alumni.ac.in/gala2027",
    likes: 55,
  },
  // Outdated / Expired Events (Due Date Passed)
  {
    title: "Legacy Code & Cloud Architecture Seminar 2025 (Expired)",
    description: "A past workshop focused on microservices migration and AWS cloud architecture.",
    event_date: new Date("2025-05-10T10:00:00.000Z"),
    event_time: "10:00 AM",
    location: "Block IV Conference Room",
    event_type: "seminar",
    status: "approved",
    max_participants: 100,
    registration_link: "https://nsut-alumni.ac.in/past-seminar",
    likes: 14,
  },
  {
    title: "Alumni Spring Hackathon 2026 (Expired)",
    description: "Past 24-hour hackathon where alumni and students built open-source tools for campus automation.",
    event_date: new Date("2026-03-22T09:00:00.000Z"),
    event_time: "09:00 AM",
    location: "NSUT Computer Center",
    event_type: "workshop",
    status: "approved",
    max_participants: 150,
    likes: 27,
  },
];

async function seedNextYearEvents() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/nalum";
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    // Find an alumni or admin user to set as creator
    let creator = await User.findOne({ role: "admin" }) || await User.findOne({ role: "alumni" }) || await User.findOne();
    
    if (!creator) {
      console.error("❌ No user found in database to assign as event creator. Please seed users first.");
      process.exit(1);
    }

    console.log(`Using creator user: ${creator.name} (${creator.email})`);

    let createdCount = 0;
    for (const data of eventsToSeed) {
      const existing = await Event.findOne({ title: data.title });
      if (existing) {
        console.log(`⚠️ Event "${data.title}" already exists. Updating date...`);
        existing.event_date = data.event_date;
        existing.status = data.status;
        await existing.save();
        continue;
      }

      await Event.create({
        ...data,
        created_by: creator._id,
        creator_name: creator.name,
        creator_email: creator.email,
        contact_info: {
          phone: "9876543210",
          email: creator.email,
          website: "https://nsut-alumni.ac.in",
        },
      });
      console.log(`✅ Created Event: "${data.title}" for Date: ${data.event_date.toISOString().split('T')[0]}`);
      createdCount++;
    }

    console.log(`\n🎉 Successfully seeded ${createdCount} new events (including 2027 upcoming & expired events)!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding events:", err);
    process.exit(1);
  }
}

seedNextYearEvents();
