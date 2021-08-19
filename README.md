<h1 align ="center">Aiven-Kafka-Socks</h1>
<p align="center">A quickstart guide to set up Aiven Kafka with Kafka-Socks</p>
<h2>About</h2>
<p> Aiven is a next-generation managed cloud service hosting for your software infrastructure services. Aiven takes the pain away from hosting databases and messaging services in the public cloud by offering automated, flexible and powerful solutions. Aiven’s services are easy and fast to setup, highly secure, highly automated, and have the widest regional coverage in the market.</p>

<p> Kafka Socks is an easy-to-use and lightweight framework that combines Kafka consumer functionality with WebSockets to pipe the Kafka messages directly to the frontend client, in realtime.</p>

<h2> To get started</h2>
1. Create a new Service in the Aiven Console, and choose Kafka as the service type. https://console.aiven.io/
2. Select the options for the desired cloud provider, region, service plan, and service name.
3. Once the service is being created you will see the status set to "rebuilding". Once that status changes to "Running" the service is ready to use. 
4. From the Overview tab, download the three authentication files and place them in the project directory. You will use these files for easy fast setup.
5. Install the dependencies
`npm install kafka-socks express kafkajs socket.io`

Require them in as well
``` javascript
const fs = require('fs');
const {Kafka, logLevel } = require('kafkajs');
const { Consumer, Subject } = require('kafka-socks')

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);
```

6. Instantiate Aiven Kafka and choose a Topic name. Also add this Topic to the Aiven service under the Topics tab.
```javascript
const TOPIC = 'Kafka-Socks-Topic';

const MASTER_BROKER = process.env.ServiceURI;
if (!MASTER_BROKER) {
  throw new Error('ServiceURI is not defined. See README.');
}
const key = fs.readFileSync('./service.key');
const cert = fs.readFileSync('./service.cert');
const ca = fs.readFileSync('./ca.pem');
```

7. Set up a KafkaJS producer
```javascript
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
```

8. Set up a Kafka-Socks consumer and websocket
```javascript
async function aivenConsumer(kafka) {
  const consumer = kafka.consumer({
    groupId: 'Kafka-Socks-Group',
  });

  const consumer_1 = new Consumer(consumer, 'Kafka-Socks-Topic', 'Kafka-Socks-Event');
  const proofSubject = new Subject(io, 'proof');
  proofSubject.add(consumer_1);
  await proofSubject.connect()
  await consumer.disconnect();
}
```
9. Call all the functions in order
```javascript
async function aivenKafka() {
  const kafka = await kafkaConnect();
  await aivenProducer(kafka);
  await aivenConsumer(kafka);   
}

aivenKafka();
```

10. Finally add a websocket listener to the client to deliver the events.
```javascript
<body>
    <h1>Aiven Kafka with Kafka-Socks</h1>
    <p>Proof of Concept</p>
    <div>
        <ul id="proofpass"></ul>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let socketEvent = io('/proof') //connection to Subject 
        socketEvent.on('Kafka-Socks-Event', function(message){
            const line = document.createElement('li')
            console.log(message)
            line.textContent = message;
            proofpass.appendChild(line)
        })
    </script>
</body>
```

Dont forget to serve the file
```javascript
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});
```

<h2>To Run</h2>
To run the project you will need the ServiceURI from the Aiven Serivce Overview tab. Edit the following command to include the Service URI 
ex:         
`ServiceURI=aiven-kafka-socks-jenessa-e445.aivencloud.com:10158 node main.js`
ServiceURI=<<service-uri>> node main.js

<h2> Results </h2>
You should be able to see your events on localhost:3000
