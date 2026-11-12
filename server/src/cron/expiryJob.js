import cron from 'node-cron';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

let running = false;

async function runExpirySweep() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const flagged = await Post.updateMany(
      { isExpired: false, expiresAt: { $lte: now } },
      { $set: { isExpired: true } },
    );

    const retentionDays = Math.max(1, Number.parseInt(process.env.EXPIRED_RETENTION_DAYS || '30', 10) || 30);
    const retentionCutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const stalePosts = await Post.find({ expiresAt: { $lte: retentionCutoff } }).select('_id').lean();

    if (stalePosts.length) {
      const staleIds = stalePosts.map((post) => post._id);
      await Comment.deleteMany({ postId: { $in: staleIds } });
      const removed = await Post.deleteMany({ _id: { $in: staleIds } });
      console.log(`[expiry] flagged=${flagged.modifiedCount} purged=${removed.deletedCount} retention=${retentionDays}d`);
    } else if (flagged.modifiedCount) {
      console.log(`[expiry] flagged=${flagged.modifiedCount} expired post(s)`);
    }
  } catch (error) {
    console.error('[expiry] sweep failed:', error.message);
  } finally {
    running = false;
  }
}

export function startExpiryJob() {
  cron.schedule('* * * * *', runExpirySweep);
  runExpirySweep();
  console.log('[expiry] scheduled every minute');
}
