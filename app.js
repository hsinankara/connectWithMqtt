/*==========================================
 Title:   Integrating your IoT devices to Turkcell IoT Platform with MQTT
 Author:  SINAN KARA
 Date:    02 Jan 2020
 Article: https://www.linkedin.com/
*/

// MQTT dependency https://github.com/mqttjs/MQTT.js
const mqtt = require("mqtt");

// client, user and device details
const serverUrl   = "tcp://mqtt.iot.turkcell.com.tr"; // constant url for all mqtt connections on TURKCELL IoT Platform
const clientId    = "myClientId"; // give a client Id on your choice. keep in mind that this id should be same with the one you register on Device Registration page.
const device_name = "My Device"; // give a device name on your choice

// initial connection credentials
const tenant_initial      = "management";
const username_initial    = "devicebootstrap";
const password_initial    = ""; // Please send an email to IOT-ADMIN@turkcell.com.tr with the subject of "Request for Bootstrap user credentials" to get the initial password

var refreshIntervalId = 0;
var temperature   = 25;

// connect the client to Cumulocity
const clientInitial = mqtt.connect(serverUrl, {
    username: tenant_initial + "/" + username_initial,
    password: password_initial,
    clientId: clientId
});

// once connected...
clientInitial.on("connect", function () {
    console.log('Connected');
    clientInitial.subscribe("s/dcr", {qos: 2, retain: true});
    console.log('Subscribed to topic: s/dcr');

    // Go back to device registration page on https://<your-tenant>.iot.turkcell.com.tr/apps/devicemanagement/index.html#/deviceregistration
    // and notice that status has been changed to "PENDING ACCEPTANCE". Click "Accept".
    refreshIntervalId = setInterval(function() {
        console.log("Repeating publishing: s/ucr");
        clientInitial.publish("s/ucr","",{qos: 2, retain: true});
    }, 3000);
});

// display all incoming messages
clientInitial.on("message", function (topic, message) {
    console.log('Received topic:message "' + topic + ':' + message + '"');

    if (message.toString().indexOf("70") == 0) {
        console.log("Downloading device credentials...");
        clearInterval(refreshIntervalId);
        var credentials =  message.toString().split(',');
        var tn = credentials[1];
        var un = credentials[2];
        var pw = credentials[3];

        console.log('tenant:' + tn + ' username:' + un + ' password:' + pw);
        console.log("Device credentials are downloaded");

        var clientBootstrap = mqtt.connect(serverUrl, {
            username: tn + "/" + un,
            password: pw,
            clientId: clientId
        });

        // once connected...
        clientBootstrap.on("connect", function () {
            // ...create a new device
            clientBootstrap.publish("s/us", "100," + device_name + ",c8y_MQTTDevice");

            // send a temperature measurement every 3 seconds
            // to be able to see these measurements on UI, navigate to https://<your-tenant>.iot.turkcell.com.tr/apps/devicemanagement/index.html#/device/22354/measurements
            setInterval(function() {
                console.log("Sending temperature measurement: " + temperature + "º");
                clientBootstrap.publish("s/us", "211," + temperature);
                temperature += 0.5 - Math.random();
            }, 3000);
        });
    }
});


