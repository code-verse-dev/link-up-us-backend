const User = require("../../models/User");
const Subscription = require("../../models/Subscription");
const Referral = require("../../models/Referral");
const MarketplaceItem = require("../../models/MarketplaceItem");
const Partner = require("../../models/Partner");
const { ApiResponse } = require("../../helpers");

/** GET /api/admin/dashboard/stats — counts + time-series for charts (monthly, last 12 months) */
exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalReferrals,
      usersByMonth,
      subscriptionsByMonth,
      marketplaceCount,
      partnersCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Referral.countDocuments(),
      User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Subscription.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MarketplaceItem.countDocuments(),
      Partner.countDocuments(),
    ]);

    // Referral links = one per active user (each gets a join URL in admin referrals/links)
    const referralLinksCount = activeUsers;

    // Build last 12 months with keys YYYY-MM, fill missing with 0
    const monthMap = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = { date: key, users: 0, subscriptions: 0 };
    }
    usersByMonth.forEach((row) => {
      if (monthMap[row._id]) monthMap[row._id].users = row.count;
    });
    subscriptionsByMonth.forEach((row) => {
      if (monthMap[row._id]) monthMap[row._id].subscriptions = row.count;
    });
    const chartData = Object.keys(monthMap)
      .sort()
      .map((date) => monthMap[date]);

    return res.json(
      ApiResponse(
        {
          counts: {
            totalUsers,
            activeUsers,
            totalSubscriptions,
            activeSubscriptions,
            totalReferrals,
            referralLinksCount,
            marketplaceCount,
            partnersCount,
          },
          chartData,
        },
        "OK",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
