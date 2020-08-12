var config = {};

config.dbhost =
	process.env.DBHOST || 'mongodb+srv://jakub:Kubacek2010@cluster-jakub-qb3js.mongodb.net/appointment?retryWrites=true&w=majority';
config.host = process.env.HOST || 'http://localhost';

module.exports = config;
