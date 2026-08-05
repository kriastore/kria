// Re-encode every product "full" image on Firebase Storage to smaller WebP
// (quality 92) while preserving the existing download token so all current
// image URLs keep working. No Firestore changes are needed.
//
// Setup:
//   1. Download a service account key JSON from Firebase Console ->
//      Project settings -> Service accounts -> Generate new private key.
//   2. Point GOOGLE_APPLICATION_CREDENTIALS at that file.
//
// Usage:
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"
//   node scripts/reencode-images.js            # re-encode and overwrite
//   node scripts/reencode-images.js --dry-run  # report savings only

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const sharp = require('sharp');

const DRY_RUN = process.argv.includes('--dry-run');
const FULL_QUALITY = 92;

function extractPathAndBucket(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'firebasestorage.googleapis.com') return null;
    const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!m) return null;
    return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

function mb(n) {
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  const saPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saPath) {
    console.error(
      'Missing service account. Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON path.'
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(saPath)),
  });
  const db = admin.firestore();

  const snap = await db.collection('inventory').get();
  console.log(
    `Found ${snap.size} products.${DRY_RUN ? ' DRY RUN - nothing will be written.' : ''}\n`
  );

  let processed = 0;
  let failed = 0;
  let savedBytes = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const name = data.ProductName || data.Description || doc.id;
    for (const field of ['ImageUrl1', 'ImageUrl2', 'ImageUrl3']) {
      const url = data[field];
      if (!url) continue;
      const info = extractPathAndBucket(url);
      if (!info) {
        console.log(`- [${name}] ${field}: skipped (not on Firebase Storage)`);
        continue;
      }

      const file = admin.storage().bucket(info.bucket).file(info.path);
      try {
        const [metadata] = await file.getMetadata();
        const token =
          metadata.metadata && metadata.metadata.firebaseStorageDownloadTokens;
        const [buffer] = await file.download();
        const resized = await sharp(buffer)
          .rotate()
          .webp({ quality: FULL_QUALITY, effort: 4 })
          .toBuffer();
        const delta = buffer.byteLength - resized.byteLength;
        savedBytes += Math.max(0, delta);

        if (!DRY_RUN) {
          await file.save(resized, {
            contentType: 'image/webp',
            resumable: false,
            metadata: {
              metadata: token
                ? { firebaseStorageDownloadTokens: token }
                : {},
            },
          });
        }
        processed++;
        const pct =
          buffer.byteLength > 0
            ? Math.round((delta / buffer.byteLength) * 100)
            : 0;
        console.log(
          `- [${name}] ${field}: ${mb(buffer.byteLength)} -> ${mb(
            resized.byteLength
          )} (${pct}% smaller)${DRY_RUN ? ' [dry]' : ''}`
        );
      } catch (err) {
        failed++;
        console.error(`- [${name}] ${field}: FAILED - ${err.message}`);
      }
    }
  }

  console.log(
    `\nDone. processed=${processed} failed=${failed} totalSaved=${mb(savedBytes)}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
