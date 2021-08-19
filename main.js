const fs = require('fs');
const {Kafka, logLevel } = require('kafkajs');
const { Consumer, Subject } = require('kafka-socks')

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const { v4: uuidv4 } = require('uuid');


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

server.listen(3001, () => {
  console.log('listening on *:3001');
});


/**
 * Congifuration for Aiven Kafka
 */
const TOPIC = 'Kafka-Socks-Topic';

const MASTER_BROKER = process.env.ServiceURI;
if (!MASTER_BROKER) {
  throw new Error('ServiceURI is not defined. See README.');
}
const key = fs.readFileSync('./service.key');
const cert = fs.readFileSync('./service.cert');
const ca = fs.readFileSync('./ca.pem');


/**
 * used to connect to Broker and authorize 
 */
async function kafkaConnect() {
  return new Kafka({
    logLevel: logLevel.INFO,
    clientId: 'Kafka-Socks-Client',
    brokers: [MASTER_BROKER],
    ssl: { rejectUnauthorized: true, ca, key, cert },
  });
}


/**
 * produces messages using kafkajs
 */
async function aivenProducer(kafka) {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: TOPIC,
    messages: [{ 
        time: Date.now(),
        uuid: uuidv4(),
        value: 'Yes! Aiven Kafka and Kafka-Socks can work together!!!'
    }],
  });
  await producer.disconnect();
}


/**
 * consumes messages using kafka-socks and emits them to the websocket
 */
async function aivenConsumer(kafka) {
  let messageCount = 0;
  const consumer = kafka.consumer({
    groupId: 'Kafka-Socks-Group',
  });

  const consumer_1 = new Consumer(consumer, 'Kafka-Socks-Topic', 'Kafka-Socks-Event');
  const proofSubject = new Subject(io, 'proof');
  proofSubject.add(consumer_1);
  await proofSubject.connect()
  await consumer.disconnect();
}

/**
 * begins the process of events to publish, subscribe and emit messages
 */
async function aivenKafka() {
  const kafka = await kafkaConnect();
  await aivenProducer(kafka);
  await aivenConsumer(kafka);   
}

aivenKafka();