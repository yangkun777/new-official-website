export default ({ embed }) => {
	embed(
		'head',
		'<script src="/excel-tools/xlsx.js"></script><script src="/excel-tools/app.js" defer></script>',
	);
};
