export function setAuthCookie(res, token, nodeEnv) {
  const secure = nodeEnv === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res, nodeEnv) {
  const secure = nodeEnv === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
  });
}
