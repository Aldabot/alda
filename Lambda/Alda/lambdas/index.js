
/* @flow */

import request from 'request';
import Dialogflow from '../lib/dialogflow';
import Lambda from '../lib/lambda';
import Facebook from '../lib/facebook';
import Person from '../lib/person';
import Intent from '../lib/intent';
import mysql from 'mysql2';
import bluebird from 'bluebird';
require('dotenv').config(); // process.env.<WHATEVER>

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DIALOGFLOW_CLIENT_ACCESS_TOKEN = process.env.DIALOGFLOW_CLIENT_ACCESS_TOKEN;

const connection = mysql.createConnection({
  host     : process.env.RDS_HOST,
  user     : process.env.RDS_USER,
  password : process.env.RDS_PASSWORD,
  database : process.env.RDS_DB,
  Promise: bluebird
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

type HelloOptions = {
  name: string
};

export function handler(event: HelloOptions, context: any, callback): void {
  console.info("START Lambda handler");
  console.info(event);
  // console.info(context);
  let httpMethod = event.httpMethod;
  let queryStringParameters = event.queryStringParameters;
  let body = JSON.parse(event.body);

  const facebook = new Facebook(PAGE_ACCESS_TOKEN, body);
  const sender_psid = facebook.getSenderPSID();
  console.log("PERSON");
  const person = Person.create(connection, sender_psid);
  const dialogflow = new Dialogflow(DIALOGFLOW_CLIENT_ACCESS_TOKEN, sender_psid);
  const lambda = new Lambda(callback);

  switch(httpMethod) {
    case "GET":
      messengerGET(queryStringParameters, callback);
      break;
      // respond(200, `httpMethod: ${httpMethod}`, callback);
    case "POST":
      let messageText = facebook.getMessageText();
      dialogflow.getIntent(messageText).then((intent) => {
        console.log('INTENT');
        console.log(intent);
        facebook.sendTextToMessenger(intent).then(() =>{
          lambda.respond(200, '');
        });
      });

      //lambda.respond(200, '');
      break;
    default:
      console.error(`Unsuported httpMethod: ${httpMethod}`);
      respond(403, `Unsuported httpMethod: ${httpMethod}`, callback);
  }
}

function respond(responseCode, responseBody, callback) {
  callback(null, {
    statusCode: responseCode,
    headers: {
        "x-custom-header" : "my custom header value"
    },
    body: JSON.stringify(responseBody)
  })
}

function messengerGET(queryStringParameters, callback) {
  // curl -X GET "https://9f532725.ngrok.io/webhook?hub.verify_token=aldaHURN&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
  let VERIFY_TOKEN = "aldaHURN";

  let mode = queryStringParameters['hub.mode'];
  let token = queryStringParameters['hub.verify_token'];
  let challenge = queryStringParameters['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenged token from the request
      console.log('WEBHOOK_VERIFIED');
      callback(null, {
        statusCode: 200,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: challenge
      })
    } else {
      // Respons with '403 Forbidden' if verify tokens do not match
      console.error('Facebook Webhook failed');
      respond(403, `Forbidden`, callback);
    }
  }
  respond(400, '', callback);
}

// Handles messages events
function handleMessage(sender_psid, received_message, callback) {

  let response;

  // Check if the message contains text
  if (received_message.text) {
    if (received_message.text != 'template') {
      // Create the payload
      response = {
        "text": `Hello`
      }
    } else {
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Is this the right picture?",
              "subtitle": "Tap a button to answer.",
              "image_url": "https://www.google.es/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwi2zqGHucrYAhUJvxQKHW6TArUQjRwIBw&url=https%3A%2F%2Fwww.w3schools.com%2Fw3css%2Fw3css_images.asp&psig=AOvVaw1iJ2G4yinJP3IJFdq14PN5&ust=1515572334421701",
              "buttons": [
                {
                  "type": "postback",
                  "title": "Yes!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "No!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }
    }
  }

  callSendAPI(sender_psid, response, callback);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback, callback) {
  let response;

  let payload = received_postback.payload

  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text" : "Opps, try again!" }
  }

  callSendAPI(sender_psid, response, callback);
}
