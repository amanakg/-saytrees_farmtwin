const db = require('../../utils/dbQuery');
const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : require('uuid').v4());
const { sendListResponse } = require('../../utils/responseHelper');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.sendOTP = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    // validate phone number
    const isValid = await isValidPhoneNumber(mobile);
    if (!isValid) {
      const err = new Error('Invalid Phone Number. Please try again!');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const allOtps = await db.readTable('otp_history');

    // check if the otp already exists in otp_history and is in PENDING status
    const otpStatus = allOtps
      .filter(
        (row) =>
          String(row.phone_number) === String(mobile) &&
          row.status === 'PENDING' &&
          now < new Date(row.expires_at)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (otpStatus.length > 0) {
      await db.updateRows(
        'otp_history',
        (row) =>
          String(row.phone_number) === String(mobile) &&
          now > new Date(row.expires_at),
        { status: 'EXPIRED' }
      );
    }

    const otp = await generateOTP();
    const hashedOTP = await encryptInput(otp);

    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const storedRow = await db.insertRow('otp_history', {
      phone_number: String(mobile),
      otp: hashedOTP,
      status: 'PENDING',
      created_at: createdAt,
      expires_at: expiresAt
    });

    return sendListResponse(
      res,
      { otp: otp, expires_at: storedRow.expires_at },
      'OTP generated successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile) {
      const err = new Error('Phone Number is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!otp) {
      const err = new Error('OTP is required');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const allOtps = await db.readTable('otp_history');

    const fetchOTP = allOtps
      .filter(
        (row) =>
          String(row.phone_number) === String(mobile) &&
          row.status === 'PENDING' &&
          new Date(row.expires_at) > now
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 1);

    if (fetchOTP.length === 0) {
      const err = new Error('OTP expired.');
      err.statusCode = 400;
      throw err;
    }

    const hashedOTP = fetchOTP[0].otp;
    const rowId = fetchOTP[0].id;

    const isMatched = await bcrypt.compare(otp, hashedOTP);
    if (!isMatched) {
      const err = new Error('Invalid OTP.');
      err.statusCode = 400;
      throw err;
    }

    const accessToken = await generateAccessToken(mobile);
    const expiresAt = await formatDate(accessToken);
    const jti = uuidv4();
    const refreshToken = await generateRefreshToken(mobile, jti);

    if (!accessToken || !refreshToken) {
      const err = new Error('Failed to generate Tokens');
      err.statusCode = 400;
      throw err;
    }

    const sessionId = uuidv4();
    if (!sessionId) {
      const err = new Error('Session Id is not generated');
      err.statusCode = 400;
      throw err;
    }

    const storeRefreshToken = await db.insertRow('refresh_tokens', {
      phone_number: String(mobile),
      token_id: jti,
      session_id: sessionId,
      is_active: true,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (storeRefreshToken) {
      await db.updateRows(
        'otp_history',
        (row) => Number(row.id) === Number(rowId),
        { status: 'VERIFIED' }
      );

      await db.updateRows(
        'otp_history',
        (row) =>
          String(row.phone_number) === String(mobile) &&
          row.status === 'PENDING' &&
          Number(row.id) !== Number(rowId),
        { status: 'EXPIRED' }
      );
    }

    const token = {
      access_token: accessToken,
      expires_at: expiresAt
    };

    const profiles = await db.readTable('profiles');
    const fetchProfileId = profiles
      .filter((p) => String(p.contact) === String(mobile) && p.status === true)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 1);

    let profile;
    if (fetchProfileId.length > 0) {
      profile = {
        profile_id: fetchProfileId[0].profile_id,
        status: 1
      };
    } else {
      profile = {
        profile_id: null,
        status: 0
      };
    }

    return sendListResponse(
      res,
      {
        token_details: token,
        refreshToken: refreshToken,
        sessionId: sessionId,
        profileDetails: profile
      },
      'Verified Successfully'
    );
  } catch (err) {
    console.log('Token is not generated.');
    next(err);
  }
};

exports.accessRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken, sessionId } = req.body;

    if (!refreshToken) {
      const err = new Error('Unauthorized request!');
      err.statusCode = 401;
      throw err;
    }

    if (!sessionId) {
      const err = new Error('Missing Session Id in the body');
      err.statusCode = 400;
      throw err;
    }

    const decoded_token = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const tokenId = decoded_token?.token_id;
    const mobile = decoded_token?.phone_number;

    const now = new Date();
    const allTokens = await db.readTable('refresh_tokens');
    const user_session = allTokens
      .filter(
        (row) =>
          row.session_id === sessionId &&
          row.token_id === tokenId &&
          row.is_active === true &&
          now < new Date(row.expires_at)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (!user_session || user_session.length === 0) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 400;
      throw err;
    }

    const access_token = await generateAccessToken(mobile);
    const expiresAt = await formatDate(access_token);

    if (!access_token) {
      const err = new Error('Cannot generate access token.');
      err.statusCode = 400;
      throw err;
    }

    return sendListResponse(
      res,
      { access_token: access_token, expires_at: expiresAt },
      'Token generated successfully'
    );
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      err = new Error('Refresh Token expired. Please login again.');
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      const err = new Error('Missing Session Id in the body');
      err.statusCode = 400;
      throw err;
    }

    const allTokens = await db.readTable('refresh_tokens');
    const user_session = allTokens
      .filter((row) => row.session_id === sessionId && row.is_active === true)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (!user_session || !user_session.length) {
      const err = new Error('No active session is found');
      err.statusCode = 401;
      throw err;
    }

    const destory_session = await db.deleteRows(
      'refresh_tokens',
      (row) => row.session_id === sessionId
    );

    const now = new Date();
    await db.deleteRows('refresh_tokens', (row) => new Date(row.expires_at) < now);

    if (!destory_session || !destory_session.length) {
      const err = new Error('No active session is found');
      err.statusCode = 404;
      throw err;
    }

    return sendListResponse(res, { _id: destory_session[0].id }, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

async function isValidPhoneNumber(mobile) {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(mobile);
}

async function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function encryptInput(input) {
  const saltRounds = 5;
  return new Promise((resolve, reject) => {
    bcrypt.hash(input, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

async function generateAccessToken(mobile) {
  const payload = {
    phone_number: mobile
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
  });
}

async function generateRefreshToken(mobile, jti) {
  const payload = {
    phone_number: mobile,
    token_id: jti
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  });
}

async function formatDate(token) {
  const decoded = jwt.decode(token).exp;
  const expiryTime = new Date(decoded * 1000);
  const expiryDate = new Date(expiryTime);
  const options = { timeZone: 'Asia/Kolkata', hour12: false };
  return expiryDate.toLocaleString(undefined, options);
}
