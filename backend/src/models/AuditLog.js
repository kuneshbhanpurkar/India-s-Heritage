import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
	{
		actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		actorEmail: { type: String, trim: true },
		actorRole: { type: String, trim: true },
		action: { type: String, required: true, trim: true }, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'CATEGORY_TOGGLE'
		entity: { type: String, required: true, trim: true }, // 'Content', 'City', 'State', 'DistrictCategory', 'User'
		entityId: { type: mongoose.Schema.Types.Mixed },
		summary: { type: String, default: '' },
		details: { type: mongoose.Schema.Types.Mixed, default: {} },
		ip: { type: String, default: '' },
		userAgent: { type: String, default: '' },
	},
	{ timestamps: { createdAt: 'timestamp', updatedAt: false } },
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
