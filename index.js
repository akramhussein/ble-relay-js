'use strict';

var mqtt_ble = require('./mqtt_ble_relay');


var config = {
    mqtt: {
        host: 'localhost',
        port: '9898'
    },
    ble: {
        displayName : 'Snips',
        serviceUUID : '025A7775-49AA-42BD-BBDB-E2AE77782966',
        characteristicUUID : 'F38A2C23-BC54-40FC-BED0-60EDDA139F47'
    }
}


mqtt_ble.start(config);
