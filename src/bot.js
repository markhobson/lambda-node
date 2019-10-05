const pluralize = require('pluralize');
const stopwords = require('./stopwords.js');
const emoji = require('./emoji.js');

module.exports.process = function(event, web) {
	const names = getPaths(event.text)
		.map(path => path.out)
		.reduce((array, next) => array.concat(next), []);
	
	const name = randomElement(names);
	
	if (event.channel.startsWith('D')) {
		const reply = name ? toEmoji(name) : 'I have nothing.';
		web.chat.postMessage({channel: event.channel, text: reply})
			.catch(error => console.log(`Error posting Slack message: ${error}`));
	}
	else if (name) {
		web.reactions.add({name, channel: event.channel, timestamp: event.event_ts})
			.catch(error => console.log(`Error adding Slack reaction: ${error}`));
	}
};

module.exports.explain = function(text, emoji) {
	let name = toName(emoji);

	if (!text || !name) {
		return 'I don\'t understand.';
	}
	
	const paths = getPaths(text)
		.filter(path => contains(path.out, name));
	
	const path = randomElement(paths);
	
	return path
		? `I heard _${path.in}_ which made me think of ${emoji}.`
		: 'I never said that.';
};

function getPaths(text) {
	const words = text
		.replace(/http[^\s]*/, '')
		.replace(/@[^\s]+/, '')
		.replace(/^\/.*/, '')
		.match(/\w{2,}/g) || [];
	
	return words
		.map(word => ({in: word, out: word.toLowerCase()}))
		.filter(path => !stopwords.has(path.out))
		.map(path => ({...path, out: pluralize.singular(path.out)}))
		.filter(path => emoji.has(path.out))
		.map(path => ({...path, out: emoji.get(path.out)}));
}

const toName = emoji => (/:(.*):/.exec(emoji) || [])[1];

const toEmoji = name => `:${name}:`;

const contains = (array, element) => array.indexOf(element) !== -1;

const randomElement = array => array[Math.floor(Math.random() * array.length)];
