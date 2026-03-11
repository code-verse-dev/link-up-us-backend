const jwt = require("jsonwebtoken");

exports.ApiResponse = (data = {}, message = "", status = false) => ({
  status: !!status,
  message: message || "",
  data,
});

exports.generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      memberId: user.memberId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.generateMemberId = async (User) => {
  const count = await User.countDocuments();
  return `LU${String(101 + count).padStart(3, "0")}`;
};

exports.generateString = (length = 8, onlyCaps = false, onlyNumbers = false) => {
  let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  if (onlyCaps) charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (onlyNumbers) charset = "1234567890";
  let ret = "";
  for (let i = 0; i < length; i++) {
    ret += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return ret;
};

exports.generateReferralCode = async (User) => {
  let code;
  let exists = true;
  while (exists) {
    code = "LU" + String(100 + Math.floor(Math.random() * 900));
    exists = await User.exists({ memberId: code });
  }
  return code;
};
