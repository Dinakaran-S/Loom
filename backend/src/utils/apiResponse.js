function success(res, data, message, status = 200) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

function paginated(res, items, { page, limit, total }) {
  return res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
}

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

module.exports = { success, paginated, fail };
