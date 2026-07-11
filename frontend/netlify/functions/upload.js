const https = require('https');
const crypto = require('crypto');

// R2 credentials
const R2_ACCOUNT_ID = '44da9856774117c8014f20e6abd86864';
const R2_ACCESS_KEY = 'f55c4ecf1386625a0bc98e0b69d72e2d';
const R2_SECRET_KEY = '18c6bbb26199589cefc8146c0c137c6b71a2b1e28dcdc62b2664ef69d6d649ec';
const R2_BUCKET = 'epages';
const R2_PUBLIC_URL = 'https://pub-9e8ce1f67b0143da86abd4bd7dc5449d.r2.dev';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' }) };
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No boundary in Content-Type' }) };
    }

    // Decode body
    const bodyBuffer = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : Buffer.from(event.body, 'binary');

    // Parse multipart
    const boundaryBuffer = Buffer.from('--' + boundary);
    let fileData = null;
    let fileName = 'file.bin';
    let fileContentType = 'application/octet-stream';
    let folder = 'uploads';

    const parts = bodyBuffer.toString('binary').split('--' + boundary);

    for (const part of parts) {
      if (part.trim() === '' || part.trim() === '--') continue;

      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;

      const headerPart = part.substring(0, headerEndIndex);
      const bodyPart = part.substring(headerEndIndex + 4);

      if (headerPart.includes('name="file"')) {
        // Extract filename
        const fileNameMatch = headerPart.match(/filename="([^"]+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];

        // Extract content type
        const ctMatch = headerPart.match(/Content-Type:\s*([^\r\n]+)/i);
        if (ctMatch) fileContentType = ctMatch[1].trim();

        // Get file data - remove trailing boundary stuff
        let cleanBody = bodyPart;
        const endIndex = cleanBody.lastIndexOf('\r\n');
        if (endIndex > 0) {
          cleanBody = cleanBody.substring(0, endIndex);
        }
        
        fileData = Buffer.from(cleanBody, 'binary');
      } else if (headerPart.includes('name="folder"')) {
        let folderValue = bodyPart.trim();
        const endIndex = folderValue.indexOf('\r\n');
        if (endIndex > 0) {
          folderValue = folderValue.substring(0, endIndex);
        }
        if (folderValue && !folderValue.startsWith('--')) {
          folder = folderValue;
        }
      }
    }

    if (!fileData || fileData.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No file found in request' }) };
    }

    // Generate unique key
    const ext = fileName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const uniqueKey = `${folder}/${timestamp}-${random}.${ext}`;

    // AWS Signature V4
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const region = 'auto';
    const service = 's3';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash('sha256').update(fileData).digest('hex');
    
    const canonicalUri = '/' + R2_BUCKET + '/' + uniqueKey;
    const canonicalHeaders = 
      'content-type:' + fileContentType + '\n' +
      'host:' + host + '\n' +
      'x-amz-content-sha256:' + payloadHash + '\n' +
      'x-amz-date:' + amzDate + '\n';
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = 'PUT\n' + canonicalUri + '\n\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash;
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

    const credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request';
    const stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + credentialScope + '\n' + canonicalRequestHash;

    // Signing key
    const kDate = crypto.createHmac('sha256', 'AWS4' + R2_SECRET_KEY).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authHeader = 'AWS4-HMAC-SHA256 Credential=' + R2_ACCESS_KEY + '/' + credentialScope + 
      ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;

    // Upload to R2
    const uploadResult = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: host,
        port: 443,
        path: canonicalUri,
        method: 'PUT',
        headers: {
          'Content-Type': fileContentType,
          'Content-Length': fileData.length,
          'x-amz-date': amzDate,
          'x-amz-content-sha256': payloadHash,
          'Authorization': authHeader
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`R2 upload failed: ${res.statusCode} - ${responseData}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => reject(new Error('Upload timeout')));
      req.write(fileData);
      req.end();
    });

    const publicUrl = `${R2_PUBLIC_URL}/${uniqueKey}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, url: publicUrl })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Upload failed' })
    };
  }
};
