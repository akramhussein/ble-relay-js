'use strict';

var mqtt = require('mqtt');
var ble = require('./ble_relay');

class Relay {
	constructor(config) {
		var client = mqtt.connect({host: config.mqttURL, port: config.mqttPort});

		var onMessage = function(buffer) {
			var json = JSON.parse(buffer);
			var message = new Buffer(json.message, 'base64');
			client.publish(json.topic, message);
		}

		var getReadData = function() { return new Buffer('Read data'); }

		var bleRelay = new ble.Relay(onMessage, getReadData);

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

		this.config = config;
		this.client = client;
		this.bleRelay = bleRelay;
	}

	start() {
		var client = this.client;
		this.client.on('connect', function () {
		  	client.subscribe('#');
		});
		this.bleRelay.start(
			this.config.displayName,
			this.config.serviceUUID,
			this.config.characteristicUUID
		);
	}
}

module.exports = {Relay: Relay};
