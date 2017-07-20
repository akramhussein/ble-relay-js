'use strict';

var bleno = require('bleno');
var sdp = require('simple-datagram-protocol');


var key = 255;
var sendMessage = function(message, datagramSize, sendDatagram) {
    key = (key + 1) % 256;
    var datagramView = new sdp.DatagramView(message, key, datagramSize);
    for (var i = 0; i < datagramView.numberOfDatagrams; i++) {
        var datagram = datagramView.getDatagram(i);
        sendDatagram(datagram);
    }
};


var _defaultSendMessage = function(buffer) { 
    console.log("Can't send message"); 
};


var start = function(config) {
    var relay = {
        config: config,
        sendMessage: _defaultSendMessage,
        messageManager: new sdp.MessageManager(config.onMessage)
    };

    var characteristic = new bleno.Characteristic({
        value : null,
        uuid : config.characteristicUUID,
        properties : ['notify', 'read', 'write'],
    
        onSubscribe : function(maxValueSize, updateValueCallback) {
            console.log('Device subscribed');
            console.log('Datagram max size: ' + maxValueSize);
            relay.sendMessage = function(buffer) { 
                sendMessage(buffer, maxValueSize, updateValueCallback);
            };
        },
    
        onUnsubscribe : function() {
            console.log('Device unsubscribed');
            relay.sendMessage = _defaultSendMessage;
        },
    
        // Send a message back to the client with the characteristic's value
        onReadRequest : function(offset, callback) {
            console.log('Read request received');
            callback(this.RESULT_SUCCESS, relay.onReadData())
            bleno.stopAdvertising();
        },
    
        // Accept a new value for the characterstic's value
        onWriteRequest : function(data, offset, withoutResponse, callback) {
            this.value = data;
            if (null !== data) {
                relay.messageManager.processDatagram(data);
            }
            console.log('Write request: value = ' + this.value.toString('utf-8'));
            callback(this.RESULT_SUCCESS);
        }
    })
    
    var service = new bleno.PrimaryService({
        uuid : config.serviceUUID,
        characteristics : [characteristic]
    })
    
    // Once bleno starts, begin advertising our BLE address
    bleno.on('stateChange', function(state) {
        console.log('State change: ' + state);
        if (state === 'poweredOn') {
            bleno.startAdvertising(config.displayName, [config.serviceUUID]);
        } else {
            bleno.stopAdvertising();
        }
    });
    
    // Notify the console that we've accepted a connection
    bleno.on('accept', function(clientAddress) {
        console.log('Accepted connection from address: ' + clientAddress);
    });
    
    // Notify the console that we have disconnected from a client
    bleno.on('disconnect', function(clientAddress) {
        console.log('Disconnected from address: ' + clientAddress);
    });
    
    // When we begin advertising, create a new service and characteristic
    bleno.on('advertisingStart', function(error) {
        if (error) {
            console.log('Advertising start error:' + error);
            return;
        }
        console.log('Advertising start success');
        bleno.setServices([service]);
    });

    return relay;
}


module.exports = {start: start};
