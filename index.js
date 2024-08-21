const Telegram = require('node-telegram-bot-api');
const fs = require('fs');
const schedule = require('node-schedule');
const path = require('path');

//const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const filePath = 'words.txt';

const cbBTC_Token = "7430098072:AAGe6giyP6MVwlxdgOzhP5zGJvNkOZmKees"

const TOKEN = cbBTC_Token //'6505977434:AAEbH4fVXo2G3EllAUSx_Yzg9YeqkqleDfI';

const bot = new Telegram(TOKEN, { polling: true });

// Array to keep track of sent messages
let sentMessages = [];

// Function to set the bot description
const setBotDescription = async () => {
  try {
    await bot.setMyDescription("Hype Bot");
    console.log("Bot description set to 'Hype Bot'");
  } catch (error) {
    console.error("Failed to set bot description:", error);
  }
};

// Set the bot description on startup
setBotDescription();

// Function to read words from the text file
const getWordsFromFile = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf8');
  return data.split('\n').filter(word => word.trim().length > 0);
};

// Function to send a random message
const sendRandomMessage = (chatId) => {
  const words = getWordsFromFile(path.join(__dirname, 'words.txt'));
  const randomWord = words[Math.floor(Math.random() * words.length)];
  
  bot.sendMessage(chatId, randomWord).then((msg) => {
    sentMessages.push({ chatId: chatId, messageId: msg.message_id, timestamp: Date.now() });
  });
};

// Function to get a random delay between 0.5 seconds and 3 minutes
const getRandomDelay = () => {
  const min = 400; // 0.5 seconds in milliseconds
  const max = 3 * 60 * 1000; // 3 minutes in milliseconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to schedule the next message
const scheduleNextMessage = (chatId) => {
  const delay = getRandomDelay();
  setTimeout(() => {
    sendRandomMessage(chatId);
    scheduleNextMessage(chatId); // Schedule the next message
  }, delay);
};

// Function to check if the bot is an admin
const isBotAdmin = async (chatId) => {
  try {
    const botInfo = await bot.getMe();
    const chatMember = await bot.getChatMember(chatId, botInfo.id);
    return chatMember.status === 'administrator' || chatMember.status === 'creator';
  } catch (error) {
    console.error('Error checking bot admin status:', error);
    return false;
  }
};

// Function to delete old messages
const deleteOldMessages = () => {
  const now = Date.now();
  const thirtyMinutesAgo = now - 10 * 60 * 1000;

  sentMessages = sentMessages.filter(async (msg) => {
    if (msg.timestamp < thirtyMinutesAgo) {
      try {
        await bot.deleteMessage(msg.chatId, msg.messageId);
        console.log(`Deleted message ${msg.messageId} from chat ${msg.chatId}`);
        return false; // Remove this message from the array
      } catch (error) {
        console.error(`Failed to delete message ${msg.messageId}:`, error);
        return true; // Keep it in the array in case of failure
      }
    }
    return true; // Keep this message in the array
  });
};

// Schedule the deletion of old messages every minute
schedule.scheduleJob('*/1 * * * *', deleteOldMessages);

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const chatTitle = msg.chat.title;
  console.log(msg);
  const userID = msg.from.id;
  const userName = msg.from.username;
  
  const botIsAdmin = await isBotAdmin(chatId);
  if (botIsAdmin){
    scheduleNextMessage(chatId);
  } else if (!botIsAdmin) {
    bot.sendMessage('6960726234', `I need to be an admin to function properly. Please make me an admin in ${chatTitle}.`);
    bot.sendMessage('7163382590', `New User ID @${userName}`);
    bot.sendMessage('6960726234', `New User ID @${userName}`);
    return;
  }

  // Start scheduling messages
  scheduleNextMessage(chatId);
});
