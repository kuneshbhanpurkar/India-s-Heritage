import 'dotenv/config';
import dns from 'dns';
import app from './app.js';
import { connectDatabase } from './config/db.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
	res.send('Welcome to the Dharohar API');
});

async function startServer() {
	try {
		await connectDatabase();
		app.listen(port, () => {
			console.log(`Dharohar API listening on ${port}`);
		});
	} catch (error) {
		console.error('Server startup failed:', error);
		process.exitCode = 1;
	}
}

startServer();
