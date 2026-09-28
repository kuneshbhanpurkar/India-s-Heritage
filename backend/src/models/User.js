import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true, select: false },
		role: {
			type: String,
			enum: ['user', 'admin', 'super_admin', 'editor', 'reviewer', 'state_admin', 'district_admin'],
			default: 'user',
		},
		stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
		cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
		allowedStateIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'State' }],
		allowedDistrictIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
		state: { type: String, default: '' },
		district: { type: String, default: '' },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export default mongoose.models.User || mongoose.model('User', userSchema);
