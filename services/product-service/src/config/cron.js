import cron from 'node-cron';
import { ProductModel } from '../models/product.model.js';
import { publishExpiryWarning } from './rabbitmq.js';

export function initCronJobs() {
  console.log('Initializing cron jobs in Product Service...');

  // Run daily at 7:00 AM
  // Pattern: minute hour day-of-month month day-of-week
  cron.schedule('0 7 * * *', async () => {
    console.log('[CRON] Scanning for expiring products...');
    await scanAndReportExpiringProducts();
  });

  // Optional: scan on startup after a delay to ensure everything is ready
  setTimeout(async () => {
    console.log('[Startup Check] Scanning for expiring products...');
    await scanAndReportExpiringProducts();
  }, 10000);
}

export async function scanAndReportExpiringProducts() {
  try {
    const expiringProducts = await ProductModel.getExpiringProducts(30);

    if (expiringProducts.length === 0) {
      console.log('[CRON] No expiring products found.');
      return;
    }

    console.log(`[CRON] Found ${expiringProducts.length} expiring products. Publishing warning...`);

    const payload = {
      danhSachSanPham: expiringProducts.map((p) => ({
        tenSanpham: p.tensanpham,
        hanSuDung: p.hansudung,
        soLuongTon: p.soluongton,
        soNgayConLai: p.songayconlai,
      })),
    };

    const published = await publishExpiryWarning(payload);
    if (published) {
      console.log('[CRON] Published product expiry warning to RabbitMQ.');
    } else {
      console.warn('[CRON] Failed to publish warning: RabbitMQ channel not available.');
    }
  } catch (err) {
    console.error('[CRON] Error scanning expiring products:', err.message);
  }
}
