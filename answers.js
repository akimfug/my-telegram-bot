const gameStat = require('./script')
console.log(gameStat.wins)
const answers = {
    startMessage: `Привет, это бот. 😊
Это сообщение отправляется, когда ты написал /start
Вот функции которые доступны:`,
    game: {
        rule: `Сейчас я загадаю цифру от 0 до 9, а ты должен её отгадать 😉`,
        go: `Погнали!`,
        win: `Красава, ты угадал! :)

        `,
        lose: `Обидно, попробуй ещё! Загаданное число было: `
    }
}

module.exports = answers