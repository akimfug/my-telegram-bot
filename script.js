'use strict';

const TelegramApi = require('node-telegram-bot-api');
const token = "7362516688:AAG4qXDbvzKPt9D2e7_vymm_ycjxVy4NQOw";
const bot = new TelegramApi(token, {polling: true});
const answers = require('./answers')


const gameStat = {
    wins: 0,
    loses: 0
}

const chats = {

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

const options = {
    reply_markup: {
        inline_keyboard: [
            [{text: 'Отгадать цифру', callback_data: 'digit'}]
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
    }
    
    bot.setMyCommands([
        {command: '/start', description: 'Начать'},
        {command: '/more', description: 'Функции'},
        {command: '/game', description: 'Отгадать цифру'}
    ])

    async function toHome(chatID) {
        if (!chats[chatID]) {
            chats[chatID] = { messageToDelete:  []};
        }
        // инициализация сообщений для удаления
        await bot.sendMessage(chatID, answers.startMessage, options)
        .then(msg => {
            chats[chatID].messageToDelete.push(msg.message_id)
        })
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

        chats[chatID] = {
            messageToDelete: []
        }
        deleteMessages(chatID)
        if (text === '/start') {
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
        // удаление сообщений
        if (!chats[ident]) {
            return bot.sendMessage(ident, 'Произошла ошибка, начните игру заново командой /game.')
            .then(msg => {
                chats[ident].messageToDelete.push(msg.message_id)
            })
        } else {
            console.log(chats[ident])
            await deleteMessages(ident)
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


            if (chats[ident].num == data) { // win
                gameStat.wins++;
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
                gameStat.loses++;
                await bot.sendSticker(ident, 'https://data.chpic.su/stickers/h/Hyghyghu/Hyghyghu_005.webp')
                .then(msg => {
                    chats[ident].messageToDelete.push(msg.message_id)
                })
                return bot.sendMessage(ident, answers.game.lose + chats[ident].num, again)
                .then(msg => {
                    chats[ident].messageToDelete.push(msg.message_id)
                })
                
            }
        }
        // console.log(`Твоё число - ${data}. Загаданное программой число - ${chats[ident].num}`)
        
        
        
    )
}
start()
module.exports = gameStat