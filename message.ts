// import botExports from './script';
// const { bot, chats } = botExports;

// console.log(bot)
// async function deleteMessages(chatId) {
//     if (chats[chatId]) {
//         const messages = chats[chatId].messageToDelete;
//         for (const messageId of messages) {
//             await bot.deleteMessage(chatId, messageId);
//         }
//         chats[chatId].messageToDelete = [];
//     } 
// }

// function message(chatID: number, msg: string, callbackButtons=null) {
//     if (chatID) {
//         console.log(chatID, msg, callbackButtons)
//         bot.sendMessage(chatID, msg, callbackButtons)
//         .then(msg => {
//             chats[chatID].messageToDelete.push(msg.message_id)
//         })
//         .catch(error => {
//             console.error(`Failed to send message in chat ${chatID}:`, error);
//         });
//     }
// }

// export {deleteMessages, message}