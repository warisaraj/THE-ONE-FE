import { environment } from '../../../environments/environment';

/** ตรงกับ BE `app.use('/download', express.static(.../public'))` */
const DOWNLOAD_PREFIX = '/download/';

function storedImagePublicPrefix(): string {
  const env = environment as { storedImagePublicSubpath?: string };
  const sub = env.storedImagePublicSubpath;
  const raw = sub !== undefined && sub !== null && String(sub) !== '' ? String(sub) : 'image';
  return String(raw).replace(/\/+$/, '').replace(/^\/+/, '');
}

/**
 * แปลงค่าจาก API ให้เป็น URL ที่ใช้ใน `img` ได้ทั้ง data URL (base64) และ path ไฟล์
 *
 * - `data:image/...;base64,...` → คืนตามเดิม
 * - `http(s)://` / `//` / `blob:` → คืนตามเดิม
 * - `assets/...` → คืนตามเดิม (รูปใน Angular)
 * - Path ใต้ `public/`: ถ้ายังไม่มี prefix โฟลเดอร์รูป (เช่น DB เก็บแค่ `deliveryDetail/2026-04-24/x.png` สัมพัทธ์จาก `pathImage`)
 *   จะต่อ `environment.storedImagePublicSubpath` (default `image`) ให้ตรงกับ BE `pathImage`
 * - Legacy: `image/...` หรือขึ้นต้นด้วย prefix ที่ตั้งไว้แล้ว → ไม่ต่อซ้ำ
 * - `{environment.ip}/download/` + path (หลัง normalize)
 *
 * @param value ค่าจากฟิลด์รูป (เดี่ยว ไม่รองรับ `|` ใน string เดียว — ให้ split ที่ caller)
 * @param apiBase ถ้าส่งจะใช้แทน `environment.ip` (ไม่มี trailing slash)
 */
export function resolveImageUrl(value: string | null | undefined, apiBase?: string): string {
  if (value == null || value === '') {
    return '';
  }
  let v = String(value).trim();
  if (!v) {
    return '';
  }

  if (
    v.indexOf('data:') === 0 ||
    v.indexOf('blob:') === 0 ||
    v.indexOf('http://') === 0 ||
    v.indexOf('https://') === 0 ||
    v.indexOf('//') === 0
  ) {
    return v;
  }

  if (v.indexOf('assets/') === 0) {
    return v;
  }

  v = v.replace(/\\/g, '/');
  if (v.indexOf('public/') === 0) {
    v = v.replace(/^public\//, '');
  }

  const base = (apiBase != null && apiBase !== '')
    ? apiBase.replace(/\/+$/, '')
    : String(environment.ip || '').replace(/\/+$/, '');

  let pathNoLead = v.replace(/^\/+/, '');
  const imgPrefix = storedImagePublicPrefix();
  const underDownload = pathNoLead.indexOf('download/') === 0;
  const alreadyHasPrefix =
    imgPrefix &&
    (pathNoLead === imgPrefix || pathNoLead.indexOf(imgPrefix + '/') === 0);
  const legacyImageFolder = pathNoLead.indexOf('image/') === 0;
  if (imgPrefix && !underDownload && !alreadyHasPrefix && !legacyImageFolder) {
    pathNoLead = (imgPrefix + '/' + pathNoLead).replace(/\/+/g, '/');
  }
  if (pathNoLead.indexOf('download/') === 0) {
    return base ? base + '/' + pathNoLead : '/' + pathNoLead;
  }

  if (!base) {
    return DOWNLOAD_PREFIX + pathNoLead;
  }

  return base + DOWNLOAD_PREFIX + pathNoLead;
}
