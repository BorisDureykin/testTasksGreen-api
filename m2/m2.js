const log4js = require('log4js');
const amqp = require('amqplib/callback_api');

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'm2.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'info' }
  }
});

const logger = log4js.getLogger();

const rabbitMqUrl = 'amqp://rabbitmq';

function startConsuming() {
  amqp.connect(rabbitMqUrl, async (error0, connection) => {
    if (error0) {
      logger.error('Failed to connect to RabbitMQ:', error0);
      setTimeout(startConsuming, 10000);
      return;
    }

    connection.createChannel(async (error1, channel) => {
      if (error1) {
        logger.error('Error creating RabbitMQ channel:', error1);
        setTimeout(startConsuming, 10000);
        return;
      }

      const queue = 'task_queue';
      const resultQueue = 'result_queue';

      channel.assertQueue(queue, { durable: false });
      logger.info('M2 is waiting for tasks');

      channel.consume(queue, async (msg) => {
        const task = JSON.parse(msg.content.toString());
        logger.info('Processing task:', task);

        const lastDigit = parseInt(msg.properties.correlationId.slice(-1));
        const delaySeconds = lastDigit;

        try {
          await new Promise((resolve) => {
            setTimeout(resolve, delaySeconds * 1000);
          });

          const newTask = { ...task, additionalField: 'added M2', postponement: delaySeconds };
          const newTaskJson = JSON.stringify(newTask);

          channel.assertQueue(resultQueue, { durable: false, autoDelete: true });
          channel.sendToQueue(resultQueue, Buffer.from(newTaskJson), {
            persistent: false,
            correlationId: msg.properties.correlationId
          });

          logger.info('Task processed and returned:', newTask);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing task:', error);
        }
      });
    });
  });
}


startConsuming();
