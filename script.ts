import 'dotenv/config'
const TelegramApi = require('node-telegram-bot-api');
import { User } from './models/User'
import answers from './answers';
import { AppDataSource } from './database';
AppDataSource.initialize().catch((err) => {
    console.error("Error during Data Source initialization", err);
});


const userRepository = AppDataSource.getRepository(User);
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramApi(token, { polling: true });

let chats = {

}


const gameOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: '1', callback_data: '1'}, {text: '2', callback_data: '2'}, {text: '3', callback_data: '3'}],
            [{text: '4', callback_data: '4'}, {text: '5', callback_data: '5'}, {text: '6', callback_data: '6'}],
            [{text: '7', callback_data: '7'}, {text: '8', callback_data: '8'}, {text: '9', callback_data: '9'}],
            [{text: '0', callback_data: '0'}]
        ]
    })
}

const again = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Заново?', callback_data: 'again'}],
            [{text: 'Вернуться', callback_data: 'home'}],
        ]
    })
}

const back = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Вернуться', callback_data: 'home'}]
        ]
    })
}

const options = {
    reply_markup: {
        inline_keyboard: [
            [
            {text: 'Отгадать цифру', callback_data: 'digit'},
            {text: 'Статистика', callback_data: 'stat'},
            {text: 'Рейтинг', callback_data: 'rating'}
            ]
        ]
    }
}

const start = () => {
    async function deleteMessages(chatId) {
        if (chats[chatId]) {
            const messages = chats[chatId].messageToDelete;
            for (const messageId of messages) {
                await bot.deleteMessage(chatId, messageId);
            }
            chats[chatId].messageToDelete = [];
        } 
    } // Перенесено в message.ts

    bot.setMyCommands([
        {command: '/start', description: 'Начать'},
        {command: '/game', description: 'Отгадать цифру'}
    ])

    async function toHome(chatID) { // вызывается обработчиком сообщений /start
        if (!chats[chatID]) {
            chats[chatID] = { messageToDelete:  []};
        }

        bot.sendMessage(chatID, answers.startMessage, options).then(msg => {
            chats[chatID].messageToDelete.push(msg.message_id)
        }); 
    }

    // game ФУНКЦИЯ 
    async function startGame(chatID) {
        
        const randomNumber = Math.floor(Math.random()*10) // Генерация правильного числа

        chats[chatID] = {
            num: randomNumber,
            messageToDelete: []
        }

        await bot.sendMessage(chatID, answers.game.rule).then(msg => {
            chats[chatID].messageToDelete.push(msg.message_id)
        }); // Начало

        await bot.sendMessage(chatID, answers.game.go, gameOptions).then(msg => {
            chats[chatID].messageToDelete.push(msg.message_id)
        }) // Погнали
    }

    // обработчик СООБЩЕНИЙ
    bot.on('message', async (e) => {
        let text = e.text
        let chatID = e.chat.id
        let userID = e.from.id
        chats[chatID] = {
            messageToDelete: []
        }
        deleteMessages(chatID)

        if (text === '/start') {
            let user = await userRepository.findOne({
                where: { id: chatID }
            })

            if (user === null) {
                user = new User()
                user.id = userID
                user.name = e.from.first_name
                user.tgHref = "@"+e.from.username
                console.log(user + 'создался такой пользователь')
                await userRepository.save(user)
            }

           return toHome(chatID)
        }

        if (text === '/game') {
            return startGame(chatID)
        }
        return bot.sendMessage(chatID, 'Введи одну из доступных комманд :)')
    }) // Этой части кода скорее всего не будет

    // обработчик КОЛЛБЭКОВ
    bot.on('callback_query', async msg => {
        const data = msg.data
        const ident = msg.message.chat.id
        const userID = msg.from.id

        // удаление сообщений
        if (!chats[ident]) {
            return bot.sendMessage(ident, 'Произошла ошибка, начните игру заново командой /game.')
            .then(msg => {
                if (chats[ident]?.messageToDelete)
                    chats[ident].messageToDelete.push(msg.message_id)
            })
        } else {
            console.log(chats[ident])
            await deleteMessages(ident)
        }

        if (data == 'stat') {
            const user = await userRepository.findOne({ where: { id: userID } })
            if (user !== null) {
                return bot.sendMessage(ident, `Статистика игр:\n✅ ${user.stats.wins ?? 0}\n⛔ ${user.stats.loses ?? 0}`, back)
                .then(msg => {
                    chats[ident].messageToDelete.push(msg.message_id)
                })
            }

            return
        }

        if (data == 'rating') {
            const userList = await userRepository
                .query(`SELECT * FROM "user" ORDER BY (stats->>'wins')::integer DESC`);

            // Логгирование для проверки
            console.log(userList, 'Рейтинг пользователей');

            if (userList.length > 0) {
                let message = 'Рейтинг игроков: \n\n'

                // Используем цикл for...of для корректной асинхронной обработки
                for (const item of userList) {
                    let name = item.name;
                    let wins = item.stats.wins;
                    let loses = item.stats.loses;
                    message += `${name} - ✅ ${wins}, ⛔ ${loses} \n`
                }

                await bot.sendMessage(ident, message, back)
                    .then(msg => {
                        chats[ident].messageToDelete.push(msg.message_id);
                    });

            }  else {
                // Если пользователей нет в базе
                await bot.sendMessage(ident, 'Рейтинг пуст. Нет данных о пользователях.')
                    .then(msg => {
                        chats[ident].messageToDelete.push(msg.message_id);
                    });
            }

            return;

        }

        if (data == 'again') {
            console.log('заново сработало')
            return startGame(ident)
        }
        if (data == 'home') {
            return toHome(ident)
        }
        if (data == 'digit') {
            return startGame(ident)
        }

        const user = await userRepository.findOne({ where: { id: userID } })

        if (chats[ident].num == data) { // win
            console.log(user + 'победа - ')
            user.stats.wins += 1;

            await userRepository.save(user);
            await bot.sendSticker(ident, 'https://data.chpic.su/stickers/h/Hyghyghu/Hyghyghu_002.webp')
                .then(msg => {
                    chats[ident].messageToDelete.push(msg.message_id)
                })
                return bot.sendMessage(ident, answers.game.win, again)
                .then(msg => {
                    chats[ident].messageToDelete.push(msg.message_id)
                })
            }

        if (chats[ident].num != data) { // lose
            console.log(user + 'проиграл - ')
            user.stats.loses += 1;

            await userRepository.save(user);
            await bot.sendSticker(ident, 'https://data.chpic.su/stickers/h/Hyghyghu/Hyghyghu_005.webp')
            .then(msg => {
                chats[ident].messageToDelete.push(msg.message_id)
            })
            return bot.sendMessage(ident, answers.game.lose + chats[ident].num, again)
            .then(msg => {
                chats[ident].messageToDelete.push(msg.message_id)
            })
            
        }
    })
}
start()
