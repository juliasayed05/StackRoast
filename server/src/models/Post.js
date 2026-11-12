import mongoose from 'mongoose';

const POST_TAGS = ['React', 'Node.js', 'Python', 'Database', 'UI/UX', 'Architecture'];
const CODE_LANGUAGES = ['javascript', 'typescript', 'python', 'sql', 'html-css', 'java'];

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    codeSnippet: { type: String, default: '', maxlength: 30000 },
    codeLanguage: { type: String, enum: CODE_LANGUAGES, default: 'javascript' },
    liveUrl: {
      type: String,
      trim: true,
      default: undefined,
      validate: {
        validator(value) {
          if (!value) return true;
          try {
            const parsed = new URL(value);
            return ['http:', 'https:'].includes(parsed.protocol);
          } catch {
            return false;
          }
        },
        message: 'Live URL must be a valid http or https URL.',
      },
    },
    tags: {
      type: [{ type: String, enum: POST_TAGS }],
      default: [],
      validate: [(value) => value.length <= POST_TAGS.length, 'Too many tags.'],
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorHash: { type: String, required: true, select: false },
    isAnonymous: { type: Boolean, default: true },
    isResolved: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    isExpired: { type: Boolean, default: false, index: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ expiresAt: 1, isExpired: 1 });
postSchema.index({ title: 'text', description: 'text' });

export { POST_TAGS, CODE_LANGUAGES };
export default mongoose.model('Post', postSchema);
