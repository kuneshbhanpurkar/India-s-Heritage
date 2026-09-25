import mongoose from 'mongoose';

export async function connectDatabase() {
	if (!process.env.MONGODB_URI) {
		throw new Error('MONGODB_URI is not configured');
	}

	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('MongoDB connected');
	} catch (error) {
		console.error('MongoDB connection failed:', error);
		throw error;
	}
}

export async function disconnectDatabase() {
	await mongoose.disconnect();
}
