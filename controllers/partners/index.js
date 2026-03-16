const Partner = require("../../models/Partner");
const { ApiResponse } = require("../../helpers");

/** POST /api/admin/partners/upload — upload logo image (multipart: logo) */
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

exports.list = async (req, res) => {
  try {
    const activeParam = req.query.active;
    const inactiveOnly = req.query.inactive === "true" || req.query.inactive === "1";
    const search = (req.query.search || "").trim();
    const filter = {};
    if (inactiveOnly) filter.active = false;
    else if (activeParam === "true" || activeParam === "1") filter.active = true;
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } },
      ];
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const [list, total] = await Promise.all([
      Partner.find(filter).sort({ sortOrder: 1, businessName: 1 }).skip(skip).limit(limit).lean(),
      Partner.countDocuments(filter),
    ]);
    const partners = list.map((p) => ({
      _id: p._id.toString(),
      businessName: p.businessName,
      name: p.name,
      logoUrl: p.logoUrl || null,
      region: p.region || "",
      sortOrder: p.sortOrder,
      active: p.active,
      createdAt: p.createdAt,
    }));
    return res.json(ApiResponse({ partners, total, limit, skip }, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

/** GET single partner by id */
exports.get = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id).lean();
    if (!partner) return res.status(404).json(ApiResponse({}, "Partner not found", false));
    const data = {
      _id: partner._id.toString(),
      businessName: partner.businessName,
      name: partner.name,
      logoUrl: partner.logoUrl || null,
      region: partner.region || "",
      sortOrder: partner.sortOrder,
      active: partner.active,
      createdAt: partner.createdAt,
    };
    return res.json(ApiResponse(data, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const filter = { active: true };
    if (q) {
      filter.$or = [
        { businessName: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { region: { $regex: q, $options: "i" } },
      ];
    }
    const list = await Partner.find(filter).sort({ sortOrder: 1, businessName: 1 }).limit(limit).lean();
    const data = list.map((p) => ({
      _id: p._id.toString(),
      memberId: "",
      businessName: p.businessName,
      name: p.name || p.businessName,
      region: p.region || "",
      logoUrl: p.logoUrl || null,
    }));
    return res.json(ApiResponse(data, "OK", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.create = async (req, res) => {
  try {
    const { businessName, name, logoUrl, region, sortOrder, active } = req.body || {};
    if (!businessName || !businessName.trim()) {
      return res.status(400).json(ApiResponse({}, "businessName is required", false));
    }
    const partner = new Partner({
      businessName: businessName.trim(),
      name: name != null ? String(name).trim() : undefined,
      logoUrl: logoUrl != null ? String(logoUrl).trim() : undefined,
      region: region != null ? String(region).trim() : "",
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      active: active !== false,
    });
    await partner.save();
    const obj = partner.toObject();
    return res.status(201).json(
      ApiResponse(
        {
          _id: obj._id.toString(),
          businessName: obj.businessName,
          name: obj.name,
          logoUrl: obj.logoUrl || null,
          region: obj.region || "",
          sortOrder: obj.sortOrder,
          active: obj.active,
          createdAt: obj.createdAt,
        },
        "Partner created",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, name, logoUrl, region, sortOrder, active } = req.body || {};
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json(ApiResponse({}, "Partner not found", false));
    }
    if (businessName !== undefined) partner.businessName = businessName.trim();
    if (name !== undefined) partner.name = name.trim();
    if (logoUrl !== undefined) partner.logoUrl = logoUrl;
    if (region !== undefined) partner.region = region.trim();
    if (sortOrder !== undefined) partner.sortOrder = Number(sortOrder);
    if (active !== undefined) partner.active = !!active;
    await partner.save();
    const obj = partner.toObject();
    
    return res.json(
      ApiResponse(
        {
          _id: obj._id.toString(),
          businessName: obj.businessName,
          name: obj.name,
          logoUrl: obj.logoUrl || null,
          region: obj.region || "",
          sortOrder: obj.sortOrder,
          active: obj.active,
          createdAt: obj.createdAt,
        },
        "Partner updated",
        true
      )
    );
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findByIdAndDelete(id);
    if (!partner) {
      return res.status(404).json(ApiResponse({}, "Partner not found", false));
    }
    return res.json(ApiResponse({ id }, "Partner deleted", true));
  } catch (err) {
    return res.status(500).json(ApiResponse({}, err.message, false));
  }
};
