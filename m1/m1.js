const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const log4js = require('log4js');

const app = express();
const logger = log4js.getLogger();

app.use(bodyParser.json());

const port = 3001;
const rabbitMqUrl = 'amqp://rabbitmq';

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'm1.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'info' }
  }
});

async function sendToRabbitMQ(data, queueName) {
    return new Promise((resolve, reject) => {
        amqp.connect(rabbitMqUrl, async (error, connection) => {
            if (error) {
                logger.error('Failed to connect to RabbitMQ:', error.message);
                reject(error);
                return;
            }

            connection.createChannel(async (error1, channel) => {
                if (error1) {
                    reject(error1);
                    return;
                }

                const queue = queueName;
                const replyQueue = 'result_queue';
                const correlationId = `${queueName}_${Date.now().toString()}`;
                logger.info(`Successfully connected to RabbitMQ. Correlation ID: ${correlationId}`);
                logger.info(correlationId);
                channel.assertQueue(replyQueue, {
                    durable: false,
                    autoDelete: true
                });

                channel.consume(replyQueue, (message) => {
                    if (message.properties.correlationId === correlationId) {
                        const result = JSON.parse(message.content.toString());
                        resolve(result);
                        setTimeout(() => {
                            connection.close();
                        }, 500);
                    }
                }, {
                    noAck: true
                });

                const message = JSON.stringify(data);

                channel.assertQueue(queue, {
                    durable: false
                });
                channel.sendToQueue(queue, Buffer.from(message), {
                    persistent: true,
                    replyTo: replyQueue,
                    correlationId: correlationId
                });

                logger.info(`Task sent: ${message}`);
            });
        });
    });
}

async function handleRequest(req, res, operation) {
    const data = req.body;
    const operationName = req.method.toUpperCase();
    logger.info(`Received ${operationName} request:`, data);
  
    try {
      const result = await sendToRabbitMQ(data, 'task_queue');
      logger.info(`Received result for ${operationName} request:`, result);
      res.json(result);
    } catch (error) {
      res.status(500).send({
        success: false,
        message: 'Error processing request',
        error: error.message
      });
    }
  }
  
  app.get('/', async (req, res) => {
    await handleRequest(req, res, 'GET');
  });
  
  app.post('/process', async (req, res) => {
    await handleRequest(req, res, 'POST');
  });
  
  app.put('/process', async (req, res) => {
    await handleRequest(req, res, 'PUT');
  });
  
  app.delete('/process', async (req, res) => {
    await handleRequest(req, res, 'DELETE');
  });

app.listen(port, () => {
    logger.info(`M1 is listening on http://localhost:${port}`);
});
