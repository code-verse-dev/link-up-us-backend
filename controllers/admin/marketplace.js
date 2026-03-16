const MarketplaceItem = require("../../models/MarketplaceItem");
const { ApiResponse } = require("../../helpers");

/** POST /api/admin/marketplace/upload — upload image for marketplace item (multipart: image) */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json(ApiResponse({}, "No file uploaded", false));
    }
    const url = `/Uploads/${req.file.filename}`;
    return res.json(ApiResponse({ url }, "Image uploaded", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/marketplace — list all marketplace items */
exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === "true";
    const search = (req.query.search || "").trim();
    const filter = activeOnly ? { active: true } : {};
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } },
      ];
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const [items, total] = await Promise.all([
      MarketplaceItem.find(filter).sort({ sortOrder: 1, businessName: 1 }).skip(skip).limit(limit).lean(),
      MarketplaceItem.countDocuments(filter),
    ]);
    return res.json(ApiResponse({ items, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET /api/admin/marketplace/:id — get single marketplace item */
exports.get = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id).lean();
    if (!item) return res.status(404).json(ApiResponse({}, "Not found", false));
    return res.json(ApiResponse(item, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** POST /api/admin/marketplace */
exports.create = async (req, res) => {
  try {
    const { businessName, name, region, logoUrl, partnerBannerUrl, databaseSize, sortOrder, active, source } = req.body || {};
    if (!businessName || !businessName.trim()) {
      return res.status(400).json(ApiResponse({}, "businessName required", false));
    }
    const item = new MarketplaceItem({
      businessName: businessName.trim(),
      name: name != null ? String(name).trim() : undefined,
      region: region != null ? String(region).trim() : "",
      logoUrl: logoUrl || undefined,
      partnerBannerUrl: partnerBannerUrl || undefined,
      databaseSize: databaseSize != null ? Number(databaseSize) : undefined,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      active: active !== false,
      source: source === "partner" ? "partner" : "member",
    });
    await item.save();
    return res.status(201).json(ApiResponse(item.toObject(), "Created", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** PATCH /api/admin/marketplace/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, name, region, logoUrl, partnerBannerUrl, databaseSize, sortOrder, active, source } = req.body || {};
    const item = await MarketplaceItem.findById(id);
    if (!item) return res.status(404).json(ApiResponse({}, "Not found", false));
    if (businessName !== undefined) item.businessName = businessName.trim();
    if (name !== undefined) item.name = name.trim();
    if (region !== undefined) item.region = region.trim();
    if (logoUrl !== undefined) item.logoUrl = logoUrl;
    if (partnerBannerUrl !== undefined) item.partnerBannerUrl = partnerBannerUrl;
    if (databaseSize !== undefined) item.databaseSize = Number(databaseSize);
    if (sortOrder !== undefined) item.sortOrder = Number(sortOrder);
    if (active !== undefined) item.active = !!active;
    if (source !== undefined) item.source = source === "partner" ? "partner" : "member";
    await item.save();
    return res.json(ApiResponse(item.toObject(), "Updated", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** DELETE /api/admin/marketplace/:id */
exports.remove = async (req, res) => {
  try {
    const item = await MarketplaceItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json(ApiResponse({}, "Not found", false));
    return res.json(ApiResponse({ id: req.params.id }, "Deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
