После загрузки проекта из репозитория выполнить команду:
<npm install> в сервисах m1 и m2 

1.- Для запуска RABBITMQ в отельном контейнере docker и запуска
    сервисов локально через  через терминал IDE коммандой <npm start>:

    1.1- Запуск RABBITMQ с указанием имени и пароля (Docker Desktop должен быть запущен):
        <docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=username -e RABBITMQ_DEFAULT_PASS=userpassword rabbitmq:management>
        
        (при необходимости заменить username:userpassword на свои)
        
        в этом случае переменная rabbitMqUrl в файлах m1 и m2:
            const rabbitMqUrl = 'amqp://username:userpassword@localhost';

    1.2- Запуск RABBITMQ с параметрами по умолчанию (Docker Desktop должен быть запущен):
        <docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management>

        в этом случае переменная rabbitMqUrl в файлах m1 и m2:
            const rabbitMqUrl = 'amqp://localhost';


2.- Для запуска RABBITMQ и сервисов m1 и m2 в одной группе контейнеров Docker compose:
    запустить Docker Desktop,
    переменная rabbitMqUrl в файлах m1 и m2:
        const rabbitMqUrl = 'amqp://rabbitmq';
    находясь в корневой дериктории проекта "testTaskGreen-api" выполнить команду:
    <docker-compose up>
    

    2.1- в случае редактирования файла docker-compose.yml для добавления имени и пароля
        RABBITMQ (добавления в блок "rabbitmq" параметров авторизации):
        environment:
            RABBITMQ_DEFAULT_USER: "username" # Имя пользователя
            RABBITMQ_DEFAULT_PASS: "userpassword" # Пароль
        переменная rabbitMqUrl в файлах m1 и m2:
            const rabbitMqUrl = 'amqp://username:userpassword@rabbitmq';

3.- После запуска сервисов они доступны поадресу: localhost:3001
    для тестирования можно использовать Postman коллекцию для тестирования
    экспортировать из файла: "M1_http---localhost-3001.postman_collection.json"

4.- Запись логирования происходит в файлы m1.log, m2.log, и выводится в консоль.
    по умолчанию включен уровень логирования "info"