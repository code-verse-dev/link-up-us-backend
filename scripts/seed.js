// Seed default data: clusters, plans, email templates, training videos.
// Usage: node scripts/seed.js
// Env: NODE_ENV=development (default) loads .env.development; NODE_ENV=customdev loads .env.customdev.

const env = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `.env.${env}` });

const mongoose = require("mongoose");
const Plan = require("../models/Plan");
const EmailTemplate = require("../models/EmailTemplate");
const TrainingVideo = require("../models/TrainingVideo");
const Cluster = require("../models/Cluster");

const { DB } = process.env;

const DEFAULT_CLUSTERS = [
  { name: "Phoenix Metro", order: 1, description: "Greater Phoenix area partners" },
  { name: "Tucson", order: 2, description: "Tucson and southern Arizona" },
  { name: "Flagstaff", order: 3, description: "Northern Arizona" },
  { name: "Prescott", order: 4, description: "Prescott region" },
  { name: "Wickenburg", order: 5, description: "Wickenburg and west" },
];

const DEFAULT_PLANS = [
  {
    name: "Link-up.us Monthly",
    priceCents: 1999,
    interval: "month",
    description: "$19.99/month – Full member access, referral tools, templates, training.",
    subtitle: "Cancel anytime. Earn $5/mo per referral.",
    active: true,
  },
  {
    name: "Link-up.us Annual",
    priceCents: 19990,
    interval: "year",
    description: "$199.90/year – Save 2 months. Full access, referral tools, templates, training.",
    subtitle: "Best value. Earn $5/mo per referral.",
    active: true,
  },
];

// Minimal HTML body for each template (so preview and download work).
function wrapHtml(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">${body}</body></html>`;
}

const DEFAULT_TEMPLATES = [
  {
    title: "October Newsletter",
    description: "Monthly partner newsletter with goals, news, and strategy.",
    order: 1,
    htmlContent: wrapHtml(
      "October Newsletter",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;"><h1 style="color:#333;">October Newsletter</h1><p style="color:#666;">Monthly update for Link Up Us partners. Goals, news, and strategy.</p><p style="color:#666;">Customize with your business name and contact details.</p></div>'
    ),
  },
  {
    title: "Welcome Bundle",
    description: "New member onboarding email.",
    order: 2,
    htmlContent: wrapHtml(
      "Welcome Bundle",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;"><h1 style="color:#333;">Welcome to Link Up Us</h1><p>Thanks for joining. Use your referral link and templates to grow your network.</p></div>'
    ),
  },
  {
    title: "Partner of the Month",
    description: "Spotlight a partner business.",
    order: 3,
    htmlContent: wrapHtml(
      "Partner of the Month",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;text-align:center;"><h2 style="color:#888;font-size:12px;letter-spacing:0.2em;">PARTNER OF THE MONTH</h2><h1 style="color:#333;">[Partner Name]</h1><p style="color:#666;">Spotlight your featured partner. Add photo and bio.</p></div>'
    ),
  },
  {
    title: "Promotion Email",
    description: "Promotional offer template.",
    order: 4,
    htmlContent: wrapHtml(
      "Promotion Email",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;"><h1 style="color:#333;">Special Offer</h1><p>Share your promotion with partners and customers. Edit text and add your offer details.</p></div>'
    ),
  },
  {
    title: "Regional Update",
    description: "Region news and new members.",
    order: 5,
    htmlContent: wrapHtml(
      "Regional Update",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;"><h1 style="color:#333;">Regional Update</h1><p>News and new members in your region. Customize for your cluster.</p></div>'
    ),
  },
  {
    title: "Referral Reminder",
    description: "Share your referral link and QR code.",
    order: 6,
    htmlContent: wrapHtml(
      "Referral Reminder",
      '<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px;"><h1 style="color:#333;">Share Your Referral Link</h1><p>Remind partners to use their referral banner and QR code. Add your link and QR image.</p></div>'
    ),
  },
];

const DEFAULT_TRAINING_VIDEOS = [
  { title: "Using Your Referral Banner", duration: "6:20", thumbnail: "https://picsum.photos/320/180?seed=1", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { title: "Newsletter Marketing for Partners", duration: "10:15", thumbnail: "https://picsum.photos/320/180?seed=2", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { title: "Cross-Promotion Strategies", duration: "12:30", thumbnail: "https://picsum.photos/320/180?seed=3", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { title: "How Referrals Grow Your Business", duration: "9:00", thumbnail: "https://picsum.photos/320/180?seed=4", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { title: "Referral Best Practices", duration: "8:45", thumbnail: "https://picsum.photos/320/180?seed=5", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { title: "QR Code & Placard Placement", duration: "7:30", thumbnail: "https://picsum.photos/320/180?seed=6", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
];

async function seed() {
  if (!DB) {
    console.error("DB env variable is required. Set NODE_ENV or use .env.development / .env.customdev.");
    process.exit(1);
  }
  await mongoose.connect(DB);
  console.log("Connected to DB (NODE_ENV=%s)", env);

  // Clusters
  if ((await Cluster.countDocuments()) === 0) {
    await Cluster.insertMany(DEFAULT_CLUSTERS);
    console.log("Created %d clusters", DEFAULT_CLUSTERS.length);
  } else {
    console.log("Clusters already exist, skipping");
  }

  // Plans
  const planCount = await Plan.countDocuments();
  if (planCount === 0) {
    await Plan.insertMany(DEFAULT_PLANS);
    console.log("Created %d plans", DEFAULT_PLANS.length);
  } else {
    console.log("Plans already exist (%d), skipping", planCount);
  }

  // Email templates: upsert by title so re-running seed updates htmlContent/order
  for (const t of DEFAULT_TEMPLATES) {
    await EmailTemplate.findOneAndUpdate(
      { title: t.title },
      { $set: { title: t.title, description: t.description, order: t.order, htmlContent: t.htmlContent } },
      { upsert: true, new: true }
    );
  }
  console.log("Upserted %d email templates", DEFAULT_TEMPLATES.length);

  // Training videos: only insert if none exist
  if ((await TrainingVideo.countDocuments()) === 0) {
    await TrainingVideo.insertMany(DEFAULT_TRAINING_VIDEOS);
    console.log("Created %d training videos", DEFAULT_TRAINING_VIDEOS.length);
  } else {
    console.log("Training videos already exist, skipping");
  }

  await mongoose.disconnect();
  console.log("Seed done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
