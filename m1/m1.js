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


// const express = require('express');
// const bodyParser = require('body-parser');
// const amqp = require('amqplib/callback_api');
// const log4js = require('log4js'); // Подключение библиотеки для логирования

// const app = express();
// const logger = log4js.getLogger(); // Инициализация логгера

// app.use(bodyParser.json());

// const port = 3001; // Порт для запуска сервера
// const rabbitMqUrl = 'amqp://admin:admin@localhost'; // URL для подключения к RabbitMQ

// // Конфигурация логгера
// log4js.configure({
//   appenders: {
//     file: { type: 'file', filename: 'm1.log' }, // Вывод логов в файл m1.log
//     console: { type: 'console' } // Вывод логов в консоль
//   },
//   categories: {
//     default: { appenders: ['file', 'console'], level: 'info' } // Категория логов по умолчанию
//   }
// });

// // Функция для работы с RabbitMQ
// async function sendToRabbitMQ(data, queueName) {
//     return new Promise((resolve, reject) => {
//         // Установление соединения с RabbitMQ
//         amqp.connect(rabbitMqUrl, async (error, connection) => {
//             if (error) {
//                 logger.error('Ошибка при подключении к RabbitMQ:', error.message);
//                 reject(error);
//                 return;
//             }

//             // Создание канала
//             connection.createChannel(async (error1, channel) => {
//                 if (error1) {
//                     reject(error1);
//                     return;
//                 }

//                 const queue = queueName; // Имя очереди
//                 const replyQueue = 'result_queue'; // Очередь для ответов
//                 const correlationId = `${Date.now().toString()}`; // Уникальный идентификатор корреляции
//                 logger.info(`Успешное подключение к RabbitMQ. Correlation ID: ${correlationId}`);

//                 // Определение очереди для ответов и ожидание результата
//                 channel.assertQueue(replyQueue, {
//                     durable: false, // Очередь не является "постоянной"
//                     autoDelete: true // Очередь будет удалена после использования
//                 });

//                 // Ожидание ответа с соответствующим Correlation ID
//                 channel.consume(replyQueue, (message) => {
//                     if (message.properties.correlationId === correlationId) {
//                         const result = JSON.parse(message.content.toString());
//                         resolve(result);
//                         setTimeout(() => {
//                             connection.close();
//                         }, 500);
//                     }
//                 }, {
//                     noAck: true // Не требуется подтверждение получения сообщения (ack)
//                 });

//                 const message = JSON.stringify(data);

//                 // Определение очереди задач и отправка задачи в очередь
//                 channel.assertQueue(queue, {
//                     durable: false // Очередь не является "постоянной"
//                 });
//                 channel.sendToQueue(queue, Buffer.from(message), {
//                     persistent: true, // Сохранение сообщения на диске
//                     replyTo: replyQueue, // Очередь для ответа
//                     correlationId: correlationId // Уникальный идентификатор корреляции
//                 });

//                 logger.info(`Задача отправлена: ${message}`);
//             });
//         });
//     });
// }

// // Обработчик HTTP POST запросов
// app.post('/process', async (req, res) => {
//     const data = req.body;
//     logger.info('Получен запрос:', data);

//     try {
//         const result = await sendToRabbitMQ(data, 'task_queue'); // Отправка задачи в RabbitMQ
//         logger.info('Получен результат:', result);
//         res.json(result);
//     } catch (error) {
//         res.status(500).send({
//             success: false,
//             message: 'Ошибка при обработке запроса',
//             error: error.message
//         });
//     }
// });

// // Обработчик HTTP GET запросов
// app.get('/', async (req, res) => {
//     const data = req.body;
//     logger.info('Получен GET запрос:', data);

//     try {
//         const result = await sendToRabbitMQ(data, 'task_queue'); // Отправка задачи в RabbitMQ
//         logger.info('Получен результат:', result);
//         res.json(result);
//     } catch (error) {
//         res.status(500).send({
//             success: false,
//             message: 'Ошибка при обработке запроса',
//             error: error.message
//         });
//     }
// });

// // Запуск сервера
// app.listen(port, () => {
//     logger.info(`M1 слушает на http://localhost:${port}`);
// });


