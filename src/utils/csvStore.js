const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

/**
 * Table schemas defining columns, primary keys, types, and default values.
 */
const TABLE_SCHEMAS = {
  states: {
    pk: 'state_id',
    columns: ['state_id', 'state_name', 'status'],
    types: { state_id: 'int', state_name: 'string', status: 'bool' },
    defaults: { status: true }
  },
  districts: {
    pk: 'district_id',
    columns: ['district_id', 'state_id', 'district_name', 'status'],
    types: { district_id: 'int', state_id: 'int', district_name: 'string', status: 'bool' },
    defaults: { status: true }
  },
  blocks: {
    pk: 'block_id',
    columns: ['block_id', 'district_id', 'block_name', 'status'],
    types: { block_id: 'int', district_id: 'int', block_name: 'string', status: 'bool' },
    defaults: { status: true }
  },
  villages: {
    pk: 'village_id',
    columns: ['village_id', 'block_id', 'village_name', 'status'],
    types: { village_id: 'int', block_id: 'int', village_name: 'string', status: 'bool' },
    defaults: { status: true }
  },
  mango: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'soc_incr', 'total_combined_er', 'fruit_yield'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', soc_incr: 'float', total_combined_er: 'float', fruit_yield: 'float' },
    defaults: {}
  },
  guava: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'soc_incr', 'total_combined_er', 'fruit_yield'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', soc_incr: 'float', total_combined_er: 'float', fruit_yield: 'string' },
    defaults: {}
  },
  jackfruit: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'soc_incr', 'total_combined_er', 'fruit_yield'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', soc_incr: 'float', total_combined_er: 'float', fruit_yield: 'float' },
    defaults: {}
  },
  jamun: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'soc_incr', 'total_combined_er', 'fruit_yield'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', soc_incr: 'float', total_combined_er: 'float', fruit_yield: 'float' },
    defaults: {}
  },
  sapota: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'soc_incr', 'total_combined_er', 'fruit_yield'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', soc_incr: 'float', total_combined_er: 'float', fruit_yield: 'float' },
    defaults: {}
  },
  cashew_nut: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  coconut: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  custard_apple: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  fig: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  lemon: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  mahogany: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'timber_biomass', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', timber_biomass: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  neem_fruit_yield: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  sweet_lime: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'fruit_yield', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', fruit_yield: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  teak: {
    pk: 'id',
    columns: ['id', 'harvest_year', 'age', 'tree_er', 'height', 'canopy_dia', 'timber_biomass', 'soc_incr', 'total_combined_er'],
    types: { id: 'int', harvest_year: 'int', age: 'int', tree_er: 'float', height: 'float', canopy_dia: 'float', timber_biomass: 'string', soc_incr: 'float', total_combined_er: 'float' },
    defaults: {}
  },
  geo_staging: {
    pk: 'state_name',
    columns: ['state_name', 'district_name', 'block_name', 'village_name'],
    types: { state_name: 'string', district_name: 'string', block_name: 'string', village_name: 'string' },
    defaults: {}
  },
  profiles: {
    pk: 'profile_id',
    columns: ['profile_id', 'name', 'contact', 'email', 'preferred_language', 'state_id', 'district_id', 'block_id', 'village_id', 'profile_pic', 'status', 'created_at', 'updated_at'],
    types: {
      profile_id: 'int',
      name: 'string',
      contact: 'string',
      email: 'string',
      preferred_language: 'string',
      state_id: 'int',
      district_id: 'int',
      block_id: 'int',
      village_id: 'int_nullable',
      profile_pic: 'string',
      status: 'bool',
      created_at: 'string',
      updated_at: 'string'
    },
    defaults: () => ({
      name: '',
      email: '',
      profile_pic: '',
      status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  },
  land_details: {
    pk: 'land_id',
    columns: ['land_id', 'profile_id', 'land_name', 'land_size', 'land_unit', 'status', 'created_at', 'updated_at'],
    types: {
      land_id: 'int',
      profile_id: 'int',
      land_name: 'string',
      land_size: 'float',
      land_unit: 'string',
      status: 'bool',
      created_at: 'string',
      updated_at: 'string'
    },
    defaults: () => ({
      land_unit: 'ACRE',
      status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  },
  saved_model: {
    pk: 'model_id',
    columns: ['model_id', 'land_id', 'model_name', 'farm_image_url', 'created_by', 'created_at'],
    types: {
      model_id: 'int',
      land_id: 'int',
      model_name: 'string',
      farm_image_url: 'string',
      created_by: 'int',
      created_at: 'string'
    },
    defaults: () => ({
      created_at: new Date().toISOString()
    })
  },
  simulation: {
    pk: 'simulation_id',
    columns: ['simulation_id', 'land_id', 'model_id', 'plantation_model_id', 'simulation_years', 'created_by', 'created_at'],
    types: {
      simulation_id: 'int',
      land_id: 'int',
      model_id: 'int',
      plantation_model_id: 'int',
      simulation_years: 'int',
      created_by: 'int_nullable',
      created_at: 'string'
    },
    defaults: () => ({
      created_at: new Date().toISOString()
    })
  },
  simulation_tree_detail: {
    pk: 'id',
    columns: ['id', 'simulation_id', 'tree_category_id', 'tree_category_name', 'tree_id', 'tree_name', 'tree_count'],
    types: {
      id: 'int',
      simulation_id: 'int',
      tree_category_id: 'int',
      tree_category_name: 'string',
      tree_id: 'int',
      tree_name: 'string',
      tree_count: 'int'
    },
    defaults: {}
  },
  otp_history: {
    pk: 'id',
    columns: ['id', 'phone_number', 'otp', 'status', 'created_at', 'expires_at'],
    types: {
      id: 'int',
      phone_number: 'string',
      otp: 'string',
      status: 'string',
      created_at: 'string',
      expires_at: 'string'
    },
    defaults: () => ({
      status: 'PENDING',
      created_at: new Date().toISOString()
    })
  },
  refresh_tokens: {
    pk: 'id',
    columns: ['id', 'phone_number', 'token_id', 'session_id', 'is_active', 'created_at', 'expires_at'],
    types: {
      id: 'int',
      phone_number: 'string',
      token_id: 'string',
      session_id: 'string',
      is_active: 'bool',
      created_at: 'string',
      expires_at: 'string'
    },
    defaults: () => ({
      is_active: true,
      created_at: new Date().toISOString()
    })
  }
};

/**
 * Storage configuration helpers
 */
function getStorageMode() {
  return (process.env.STORAGE_TYPE || 'local').toLowerCase().trim();
}

function getLocalDataDir() {
  if (process.env.CSV_LOCAL_DIR) {
    return path.resolve(process.env.CSV_LOCAL_DIR);
  }
  return path.join(__dirname, '..', 'data');
}

function getS3Config() {
  return {
    bucket: process.env.AWS_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    prefix: (process.env.AWS_S3_PREFIX || 'data/').replace(/^\/+/, ''),
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN || ''
  };
}

/**
 * RFC 4180 compliant CSV Parser
 */
function parseCSVContent(csvText, tableName) {
  if (!csvText || !csvText.trim()) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, ''); // Strip BOM if present

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map((h) => h.trim());
  const schema = TABLE_SCHEMAS[tableName];
  const result = [];

  for (let r = 1; r < rows.length; r++) {
    const line = rows[r];
    if (line.length === 1 && line[0].trim() === '') {
      continue;
    }

    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const col = headers[c];
      const rawVal = line[c] !== undefined ? line[c] : '';
      obj[col] = castValue(rawVal, schema?.types?.[col]);
    }
    result.push(obj);
  }

  return result;
}

function castValue(rawVal, type) {
  if (rawVal === undefined || rawVal === null) return null;
  const trimmed = String(rawVal).trim();

  if (type === 'int') {
    if (trimmed === '') return 0;
    const n = parseInt(trimmed, 10);
    return isNaN(n) ? 0 : n;
  }
  if (type === 'int_nullable') {
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    const n = parseInt(trimmed, 10);
    return isNaN(n) ? null : n;
  }
  if (type === 'float') {
    if (trimmed === '') return 0;
    const n = parseFloat(trimmed);
    return isNaN(n) ? 0 : n;
  }
  if (type === 'bool') {
    if (typeof rawVal === 'boolean') return rawVal;
    const lower = trimmed.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 't' || lower === 'yes';
  }
  return rawVal;
}

/**
 * RFC 4180 compliant CSV Serializer
 */
function serializeCSVField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function serializeCSVContent(tableName, rows) {
  const schema = TABLE_SCHEMAS[tableName];
  const columns = schema
    ? schema.columns
    : rows.length > 0
      ? Object.keys(rows[0])
      : [];

  const headerLine = columns.map(serializeCSVField).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => serializeCSVField(row[col])).join(',')
  );

  return [headerLine, ...dataLines].join('\n') + '\n';
}

/**
 * AWS S3 Reader / Writer (Supports @aws-sdk/client-s3 if installed, or native AWS SigV4 HTTPS)
 */
let s3SdkClient = null;
let s3SdkModule = null;

function getAwsSdkClient() {
  if (s3SdkClient) return { client: s3SdkClient, sdk: s3SdkModule };
  try {
    s3SdkModule = require('@aws-sdk/client-s3');
    const cfg = getS3Config();
    const clientConfig = { region: cfg.region };
    if (cfg.accessKeyId && cfg.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
        ...(cfg.sessionToken ? { sessionToken: cfg.sessionToken } : {})
      };
    }
    s3SdkClient = new s3SdkModule.S3Client(clientConfig);
    return { client: s3SdkClient, sdk: s3SdkModule };
  } catch (_) {
    return null;
  }
}

function signAwsV4Request({ method, host, uriPath, region, accessKeyId, secretAccessKey, sessionToken, payload = '' }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';

  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');

  const headers = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
  if (sessionToken) {
    headers['x-amz-security-token'] = sessionToken;
  }

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method,
    uriPath,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')
  ].join('\n');

  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data, 'utf8').digest();
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  headers['Authorization'] =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

function s3HttpRequest(method, key, body = '') {
  return new Promise((resolve, reject) => {
    const cfg = getS3Config();
    if (!cfg.bucket) {
      return reject(new Error('AWS_S3_BUCKET is not configured in environment variables'));
    }

    const host = `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const uriPath = `/${encodedKey}`;

    const headers = cfg.accessKeyId && cfg.secretAccessKey
      ? signAwsV4Request({
          method,
          host,
          uriPath,
          region: cfg.region,
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
          sessionToken: cfg.sessionToken,
          payload: body
        })
      : { host };

    if (method === 'PUT') {
      headers['Content-Type'] = 'text/csv; charset=utf-8';
      headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    const req = https.request(
      {
        hostname: host,
        path: uriPath,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else if (res.statusCode === 404) {
            resolve(null);
          } else {
            reject(new Error(`S3 ${method} error (${res.statusCode}): ${responseBody}`));
          }
        });
      }
    );

    req.on('error', reject);
    if (body && method === 'PUT') {
      req.write(body, 'utf8');
    }
    req.end();
  });
}

async function readRawCSVFromS3(tableName) {
  const cfg = getS3Config();
  const key = `${cfg.prefix}${tableName}.csv`;
  const sdkBundle = getAwsSdkClient();

  if (sdkBundle) {
    try {
      const cmd = new sdkBundle.sdk.GetObjectCommand({
        Bucket: cfg.bucket,
        Key: key
      });
      const response = await sdkBundle.client.send(cmd);
      return await response.Body.transformToString('utf-8');
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  return await s3HttpRequest('GET', key);
}

async function writeRawCSVToS3(tableName, csvContent) {
  const cfg = getS3Config();
  const key = `${cfg.prefix}${tableName}.csv`;
  const sdkBundle = getAwsSdkClient();

  if (sdkBundle) {
    const cmd = new sdkBundle.sdk.PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: csvContent,
      ContentType: 'text/csv; charset=utf-8'
    });
    await sdkBundle.client.send(cmd);
    return;
  }

  await s3HttpRequest('PUT', key, csvContent);
}

/**
 * In-memory cache & per-table write mutex lock
 */
const tableCache = new Map();
const writeLocks = new Map();

function getCacheTTL() {
  if (process.env.CSV_CACHE_TTL_MS !== undefined) {
    return Number(process.env.CSV_CACHE_TTL_MS);
  }
  return getStorageMode() === 's3' ? 5000 : 0;
}

async function withTableLock(tableName, fn) {
  const prevLock = writeLocks.get(tableName) || Promise.resolve();
  let releaseLock;
  const currentLock = new Promise((resolve) => {
    releaseLock = resolve;
  });
  writeLocks.set(tableName, prevLock.then(() => currentLock));

  await prevLock;
  try {
    return await fn();
  } finally {
    releaseLock();
  }
}

/**
 * Core Read / Write operations for Local & S3
 */
async function readTable(tableName) {
  const ttl = getCacheTTL();
  if (ttl > 0 && tableCache.has(tableName)) {
    const cached = tableCache.get(tableName);
    if (Date.now() - cached.timestamp < ttl) {
      return cached.rows.map((r) => ({ ...r }));
    }
  }

  const mode = getStorageMode();
  let rawText = null;

  if (mode === 's3') {
    rawText = await readRawCSVFromS3(tableName);
    // Fallback to local seed file if S3 object doesn't exist yet
    if (rawText === null) {
      const localPath = path.join(getLocalDataDir(), `${tableName}.csv`);
      if (fsSync.existsSync(localPath)) {
        rawText = await fs.readFile(localPath, 'utf8');
        await writeRawCSVToS3(tableName, rawText);
      } else {
        rawText = serializeCSVContent(tableName, []);
        await writeRawCSVToS3(tableName, rawText);
      }
    }
  } else {
    const dataDir = getLocalDataDir();
    const filePath = path.join(dataDir, `${tableName}.csv`);
    try {
      rawText = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(dataDir, { recursive: true });
        rawText = serializeCSVContent(tableName, []);
        await fs.writeFile(filePath, rawText, 'utf8');
      } else {
        throw err;
      }
    }
  }

  const rows = parseCSVContent(rawText, tableName);
  if (ttl > 0) {
    tableCache.set(tableName, { rows, timestamp: Date.now() });
  }
  return rows.map((r) => ({ ...r }));
}

async function writeTable(tableName, rows) {
  const csvContent = serializeCSVContent(tableName, rows);
  const mode = getStorageMode();

  if (mode === 's3') {
    await writeRawCSVToS3(tableName, csvContent);
  } else {
    const dataDir = getLocalDataDir();
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, `${tableName}.csv`);
    await fs.writeFile(filePath, csvContent, 'utf8');
  }

  if ( getCacheTTL() > 0 ) {
    tableCache.set(tableName, { rows: rows.map((r) => ({ ...r })), timestamp: Date.now() });
  } else {
    tableCache.delete(tableName);
  }
}

/**
 * High-level CRUD operations on CSV tables
 */
async function insertRow(tableName, data) {
  return withTableLock(tableName, async () => {
    const rows = await readTable(tableName);
    const schema = TABLE_SCHEMAS[tableName];
    const pk = schema ? schema.pk : 'id';

    const maxId = rows.reduce((max, r) => {
      const val = Number(r[pk]) || 0;
      return val > max ? val : max;
    }, 0);

    const defaults =
      typeof schema?.defaults === 'function'
        ? schema.defaults()
        : { ...(schema?.defaults || {}) };

    const newRow = {
      ...defaults,
      ...data,
      [pk]: data[pk] !== undefined ? Number(data[pk]) : maxId + 1
    };

    // Normalize types according to schema
    if (schema?.columns) {
      for (const col of schema.columns) {
        if (newRow[col] === undefined) {
          newRow[col] = null;
        } else {
          newRow[col] = castValue(newRow[col], schema.types[col]);
        }
      }
    }

    rows.push(newRow);
    await writeTable(tableName, rows);
    return { ...newRow };
  });
}

async function insertMany(tableName, items) {
  return withTableLock(tableName, async () => {
    const rows = await readTable(tableName);
    const schema = TABLE_SCHEMAS[tableName];
    const pk = schema ? schema.pk : 'id';

    let currentMaxId = rows.reduce((max, r) => {
      const val = Number(r[pk]) || 0;
      return val > max ? val : max;
    }, 0);

    const inserted = [];

    for (const data of items) {
      currentMaxId += 1;
      const defaults =
        typeof schema?.defaults === 'function'
          ? schema.defaults()
          : { ...(schema?.defaults || {}) };

      const newRow = {
        ...defaults,
        ...data,
        [pk]: data[pk] !== undefined ? Number(data[pk]) : currentMaxId
      };

      if (schema?.columns) {
        for (const col of schema.columns) {
          if (newRow[col] === undefined) {
            newRow[col] = null;
          } else {
            newRow[col] = castValue(newRow[col], schema.types[col]);
          }
        }
      }

      rows.push(newRow);
      inserted.push({ ...newRow });
    }

    await writeTable(tableName, rows);
    return inserted;
  });
}

async function updateRows(tableName, predicateFn, updateFn) {
  return withTableLock(tableName, async () => {
    const rows = await readTable(tableName);
    const schema = TABLE_SCHEMAS[tableName];
    const updatedRows = [];

    const nextRows = rows.map((row) => {
      if (predicateFn(row)) {
        const changes = typeof updateFn === 'function' ? updateFn(row) : updateFn;
        const merged = { ...row, ...changes };
        if (schema?.columns) {
          for (const col of schema.columns) {
            if (merged[col] !== undefined) {
              merged[col] = castValue(merged[col], schema.types[col]);
            }
          }
        }
        updatedRows.push({ ...merged });
        return merged;
      }
      return row;
    });

    if (updatedRows.length > 0) {
      await writeTable(tableName, nextRows);
    }

    return updatedRows;
  });
}

async function deleteRows(tableName, predicateFn) {
  return withTableLock(tableName, async () => {
    const rows = await readTable(tableName);
    const deletedRows = [];
    const remainingRows = [];

    for (const row of rows) {
      if (predicateFn(row)) {
        deletedRows.push({ ...row });
      } else {
        remainingRows.push(row);
      }
    }

    if (deletedRows.length > 0) {
      await writeTable(tableName, remainingRows);
    }

    return deletedRows;
  });
}

/**
 * Initialize local CSV files with headers if missing
 */
async function initCSVStorage() {
  const mode = getStorageMode();
  if (mode === 's3') {
    const cfg = getS3Config();
    if (!cfg.bucket) {
      console.warn('⚠️ STORAGE_TYPE=s3 is set, but AWS_S3_BUCKET is empty. Please set AWS_S3_BUCKET in .env');
    } else {
      console.log(`✅ CSV Storage initialized in AWS S3 mode (Bucket: s3://${cfg.bucket}/${cfg.prefix})`);
    }
    return;
  }

  const dataDir = getLocalDataDir();
  await fs.mkdir(dataDir, { recursive: true });

  for (const tableName of Object.keys(TABLE_SCHEMAS)) {
    const filePath = path.join(dataDir, `${tableName}.csv`);
    if (!fsSync.existsSync(filePath)) {
      const headerContent = serializeCSVContent(tableName, []);
      await fs.writeFile(filePath, headerContent, 'utf8');
    }
  }

  console.log(`✅ CSV Storage initialized in LOCAL mode (Directory: ${dataDir})`);
}

module.exports = {
  TABLE_SCHEMAS,
  getStorageMode,
  getLocalDataDir,
  getS3Config,
  readTable,
  writeTable,
  insertRow,
  insertMany,
  updateRows,
  deleteRows,
  initCSVStorage
};
