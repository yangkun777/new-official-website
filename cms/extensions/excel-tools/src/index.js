import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findXlsx() {
	const candidates = [
		path.resolve(__dirname, '../../../node_modules/xlsx/dist/xlsx.full.min.js'),
		path.resolve(__dirname, '../../node_modules/xlsx/dist/xlsx.full.min.js'),
		path.resolve(process.cwd(), 'node_modules/xlsx/dist/xlsx.full.min.js'),
	];
	for (const file of candidates) {
		if (fs.existsSync(file)) return file;
	}
	return null;
}

function sendJs(res, filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		res.status(404).type('text/plain').send('not found');
		return;
	}
	res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
	res.setHeader('Cache-Control', 'no-cache');
	res.send(fs.readFileSync(filePath, 'utf8'));
}

export default {
	id: 'excel-tools',
	handler: (router) => {
		router.get('/xlsx.js', (_req, res) => {
			sendJs(res, findXlsx());
		});

		router.get('/app.js', (_req, res) => {
			sendJs(res, path.resolve(__dirname, '../public/app.js'));
		});
	},
};
