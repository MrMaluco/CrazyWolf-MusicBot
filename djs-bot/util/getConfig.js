/**
 * Promise based module to get and return the contents of `config.js`
 * @returns {Promise<import("../config")>}
*/
module.exports = async () => {
	return new Promise((resolve, reject) => {
		try {
			const config = require("../config");
			resolve(config);
		} catch {
			reject("Nenhum arquivo de configuração encontrado.\nCertifique-se de que esteja completamente preenchido!");
		}
	}).catch(err => {
		console.log(err);
	});
};
