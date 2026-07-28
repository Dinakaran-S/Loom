const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const env = require("../config/env");

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  return success(res, { user, accessToken }, "Account created", 201);
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
  return success(res, { user, accessToken }, "Signed in");
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { UnauthorizedError } = require("../utils/errors");
  if (!token) throw new UnauthorizedError("Missing refresh token");
  const { accessToken } = await authService.refresh(token);
  return success(res, { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTS);
  return success(res, null, "Signed out");
});

module.exports = { register, login, refresh, logout };
