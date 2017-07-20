'use strict';

var mqtt = require('mqtt');
var ble = require('./ble_relay');


var start = function(config) {
	var client = mqtt.connect(config.mqtt);

	config.ble.onMessage = function(buffer) {
		var json = JSON.parse(buffer);
		var message = new Buffer(json.message, 'base64');
		client.publish(json.topic, message);
	};

	config.ble.getReadData = function() { 
		return new Buffer('Read data'); 
	};

	var bleRelay = ble.start(config.ble);

	client.on('message', function (topic, message) {
	    // message is Buffer
	    var json = {
	        'topic': topic,
	        'message': message.toString('base64')
	    }
	    var text = JSON.stringify(json);
	    var buff = new Buffer(text);
	    bleRelay.sendMessage(buff);
	});

	client.on('connect', function () {
	  	client.subscribe('#');
	});
};


module.exports = {start: start};
