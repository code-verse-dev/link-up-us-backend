// Seed default data (plans, email templates, training videos). Run once after DB is up.
// Usage: node scripts/seed.js

require("dotenv").config({ path: ".env.development" });
const mongoose = require("mongoose");
const Plan = require("../models/Plan");
const EmailTemplate = require("../models/EmailTemplate");
const TrainingVideo = require("../models/TrainingVideo");
const Cluster = require("../models/Cluster");

const { DB } = process.env;

const DEFAULT_CLUSTERS = [
  { name: "Phoenix Metro", order: 1 },
  { name: "Tucson", order: 2 },
  { name: "Flagstaff", order: 3 },
  { name: "Prescott", order: 4 },
  { name: "Wickenburg", order: 5 },
];

async function seed() {
  await mongoose.connect(DB);
  console.log("Connected to", DB);

  if ((await Cluster.countDocuments()) === 0) {
    await Cluster.insertMany(DEFAULT_CLUSTERS);
    console.log("Created default Clusters");
  }

  if ((await Plan.countDocuments()) === 0) {
    await Plan.create({
      name: "Link-up.us Monthly",
      priceCents: 1999,
      interval: "month",
      description: "$19.99/month – Full member access, referral tools, templates, training.",
      subtitle: "Cancel anytime. Earn $5/mo per referral.",
      active: true,
    });
    console.log("Created default Plan");
  }

  if ((await EmailTemplate.countDocuments()) === 0) {
    await EmailTemplate.insertMany([
      { title: "October Newsletter", description: "Monthly partner newsletter", previewUrl: "/preview/oct", htmlFile: "october.html" },
      { title: "Welcome Bundle", description: "New member onboarding", previewUrl: "/preview/welcome", htmlFile: "welcome.html" },
      { title: "Partner of the Month", description: "Spotlight a partner business", previewUrl: "/preview/partner-month", htmlFile: "partner-of-month.html" },
      { title: "Promotion Email", description: "Promotional offer template", previewUrl: "/preview/promo", htmlFile: "promo.html" },
      { title: "Regional Update", description: "Region news and new members", previewUrl: "/preview/regional", htmlFile: "regional.html" },
      { title: "Referral Reminder", description: "Share your referral link and QR", previewUrl: "/preview/referral", htmlFile: "referral.html" },
    ]);
    console.log("Created 6 EmailTemplate documents");
  }

  if ((await TrainingVideo.countDocuments()) === 0) {
    await TrainingVideo.insertMany([
      { title: "Cross-Marketing 101", duration: "12:30", thumbnail: "https://picsum.photos/320/180?seed=1", videoUrl: "/videos/cross-marketing.mp4" },
      { title: "Referral Best Practices", duration: "8:45", thumbnail: "https://picsum.photos/320/180?seed=2", videoUrl: "/videos/referrals.mp4" },
      { title: "Using Your Referral Banner", duration: "6:20", thumbnail: "https://picsum.photos/320/180?seed=3", videoUrl: "/videos/referral-banner.mp4" },
      { title: "Newsletter Marketing for Partners", duration: "10:15", thumbnail: "https://picsum.photos/320/180?seed=4", videoUrl: "/videos/newsletter.mp4" },
      { title: "How Referrals Grow Your Business", duration: "9:00", thumbnail: "https://picsum.photos/320/180?seed=5", videoUrl: "/videos/grow-business.mp4" },
      { title: "QR Code & Placard Best Placement", duration: "7:30", thumbnail: "https://picsum.photos/320/180?seed=6", videoUrl: "/videos/qr-placement.mp4" },
    ]);
    console.log("Created 6 TrainingVideo documents");
  }

  await mongoose.disconnect();
  console.log("Seed done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
