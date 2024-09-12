const TelegramBot = require('node-telegram-bot-api');
const token = '7030003832:AAFqsXe4RBRxc6sRoUkvQjCVHokF7Dynt0Y';
const bot = new TelegramBot(token, { polling: true });

// Команды и их пользователи
const teams = {
    Inferno: ['user1', 'user2'],
    Blasters: ['user3', 'user4'],
    PCC: ['user5', 'user6'],
    Mercury: ['user7', 'user8'],
    Galaxy: ['user9', 'user10'],
};

// Группы для команд
const groupChatIds = {
    Inferno: -1002393832198,
    Blasters: -1002484111053,
    PCC: -1002368568232,
    Mercury: -1002301440088,
    Galaxy: -1002364733258,
};

// Хранение запросов на пополнение
const requests = {};

// Функция для получения команды по username
const getTeamByUser = (username) => {
    for (let team in teams) {
        if (teams[team].includes(username)) {
            return team;
        }
    }
    return null;
};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Отправляем приветственное сообщение и отображаем кнопку "Пополнить"
    bot.sendMessage(chatId, 'Добро пожаловать! Нажмите "Пополнить", чтобы продолжить.', {
        reply_markup: {
            keyboard: [
                [{ text: 'Пополнить' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Обработчик текста "Пополнить"
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    // Проверяем, нажата ли кнопка "Пополнить"
    if (msg.text === 'Пополнить') {
        bot.sendMessage(chatId, 'Выберите команду, в которой вы находитесь:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Inferno', callback_data: 'team_Inferno' }],
                    [{ text: 'Blasters', callback_data: 'team_Blasters' }],
                    [{ text: 'PCC', callback_data: 'team_PCC' }],
                    [{ text: 'Mercury', callback_data: 'team_Mercury' }],
                    [{ text: 'Galaxy', callback_data: 'team_Galaxy' }]
                ]
            }
        });
    }
});

// Обработчик выбора команды и кнопки "Пополнить"
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const username = query.from.username;

    // Если пользователь выбрал команду
    if (query.data.startsWith('team_')) {
        const team = query.data.split('_')[1];  // Получаем название команды

        // Сохраняем команду и chat_id покупателя
        requests[username] = { team, buyerChatId: chatId };

        // Предлагаем выбрать тип запроса на пополнение
        bot.sendMessage(chatId, 'Выберите тип запроса на пополнение:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Агенты', callback_data: 'agents' }],
                    [{ text: 'Ламанш', callback_data: 'lamanche' }],
                    [{ text: 'Расходники', callback_data: 'consumables' }]
                ]
            }
        });
    }

    // Обработка для "Агенты"
    if (query.data === 'agents') {
        bot.sendMessage(chatId, 'Выберите агента:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Premium Agency', callback_data: 'premium_agency' }],
                    [{ text: 'Luca', callback_data: 'luca' }],
                    [{ text: 'Quang Cao', callback_data: 'quang_cao' }],
                ],
            },
        });
    }

    // Обработка для Premium Agency (группы)
    if (query.data === 'premium_agency') {
        bot.sendMessage(chatId, 'Выберите группу:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Group 1', callback_data: 'group1' }],
                    [{ text: 'Group 2', callback_data: 'group2' }],
                    [{ text: 'Group 3', callback_data: 'group3' }],
                ],
            },
        });
    }

    // Обработка для "Luca" и "Quang Cao" (ввод суммы и сервера)
    if (query.data === 'luca' || query.data === 'quang_cao') {
        bot.sendMessage(chatId, 'Введите название сервера и сумму (например: "VPS1 2000$")');
        bot.once('message', (msg) => {
            const request = msg.text;
            if (!requests[username]) requests[username] = {};
            requests[username].request = request;  // Сохраняем запрос

            const team = requests[username].team;  // Получаем команду пользователя
            const agent = query.data === 'luca' ? 'Luca' : 'Quang Cao';  // Определяем агента

            // Проверяем, существует ли команда пользователя
            if (team && groupChatIds[team]) {
                // Отправляем запрос в соответствующую командную группу
                bot.sendMessage(groupChatIds[team], `Запрос от пользователя @${username} на пополнение:\nАгенты\n${agent}\nСервер и сумма: ${request}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Оплачен', callback_data: `paid_${username}` }],
                            [{ text: 'Отклонен', callback_data: `rejected_${username}` }],
                            [{ text: 'На рассмотрении', callback_data: `pending_${username}` }],
                        ],
                    },
                });
            } else {
                bot.sendMessage(chatId, 'Произошла ошибка: команда не найдена.');
            }
        });
    }

    // Обработка для Premium Agency
    if (query.data === 'group1' || query.data === 'group2' || query.data === 'group3') {
        bot.sendMessage(chatId, 'Введите сумму и сервер (например: "VPS1 2000$")');
        bot.once('message', (msg) => {
            const request = msg.text;
            if (!requests[username]) requests[username] = {};
            requests[username].request = request;  // Сохраняем запрос

            const team = requests[username].team;  // Получаем команду пользователя

            // Проверяем, существует ли команда пользователя
            if (team && groupChatIds[team]) {
                // Отправляем запрос в соответствующую командную группу
                bot.sendMessage(groupChatIds[team], `Запрос от пользователя @${username} на пополнение:\nАгенты\nPremium Agency\n${query.data}\n${request}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Оплачен', callback_data: `paid_${username}` }],
                            [{ text: 'Отклонен', callback_data: `rejected_${username}` }],
                            [{ text: 'На рассмотрении', callback_data: `pending_${username}` }],
                        ],
                    },
                });
            } else {
                bot.sendMessage(chatId, 'Произошла ошибка: команда не найдена.');
            }
        });
    }

    // Обработка для "Ламанш"
    if (query.data === 'lamanche') {
        bot.sendMessage(chatId, 'Введите сумму:');
        bot.once('message', (msg) => {
            const request = msg.text;
            if (!requests[username]) requests[username] = {};
            requests[username].request = request;  // Сохраняем запрос

            const team = requests[username].team;  // Получаем команду пользователя

            // Проверяем, существует ли команда пользователя
            if (team && groupChatIds[team]) {
                // Отправляем запрос в соответствующую командную группу
                bot.sendMessage(groupChatIds[team], `Запрос от пользователя @${username} на пополнение:\nЛаманш\nСумма: ${request}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Оплачен', callback_data: `paid_${username}` }],
                            [{ text: 'Отклонен', callback_data: `rejected_${username}` }],
                            [{ text: 'На рассмотрении', callback_data: `pending_${username}` }],
                        ],
                    },
                });
            } else {
                bot.sendMessage(chatId, 'Произошла ошибка: команда не найдена.');
            }
        });
    }

    // Обработка для "Расходники"
    if (query.data === 'consumables') {
        bot.sendMessage(chatId, 'Введите данные для расходников (адрес, сумма, и т.д.):');
        bot.once('message', (msg) => {
            const request = msg.text;
            if (!requests[username]) requests[username] = {};
            requests[username].request = request;  // Сохраняем запрос

            const team = requests[username].team;  // Получаем команду пользователя

            // Проверяем, существует ли команда пользователя
            if (team && groupChatIds[team]) {
                // Отправляем запрос в соответствующую командную группу
                bot.sendMessage(groupChatIds[team], `Запрос от пользователя @${username} на пополнение:\nРасходники\nДанные: ${request}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Оплачен', callback_data: `paid_${username}` }],
                            [{ text: 'Отклонен', callback_data: `rejected_${username}` }],
                            [{ text: 'На рассмотрении', callback_data: `pending_${username}` }],
                        ],
                    },
                });
            } else {
                bot.sendMessage(chatId, 'Произошла ошибка: команда не найдена.');
            }
        });
    }
});

// Обработка действий команды (Оплачен/Отклонен/На рассмотрении)
bot.on('callback_query', (query) => {
    const actionData = query.data.split('_');
    const action = actionData[0];
    const username = actionData[1];
    const request = requests[username];

    if (request) {
        const buyerChatId = request.buyerChatId;  // Используем сохраненный chat_id покупателя

        if (action === 'paid') {
            bot.sendMessage(buyerChatId, `Ваша заявка:\n${request.request}\nОплачена ✔️`);
        } else if (action === 'rejected') {
            bot.sendMessage(query.message.chat.id, 'Причина отклонения заявки:');
            bot.once('message', (msg) => {
                const reason = msg.text;
                bot.sendMessage(buyerChatId, `Ваша заявка:\n${request.request}\nОтклонена ❌\nПо причине: ${reason}`);
            });
        } else if (action === 'pending') {
            bot.sendMessage(buyerChatId, `Ваша заявка:\n${request.request}\nНа рассмотрении 👀`);
        }
    }
});
