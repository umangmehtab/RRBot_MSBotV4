// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, CardFactory } = require('botbuilder');

const { MakeReservationDialog } = require('./componentDialogs/makeReservationDialog');
const { CancelReservationDialog } = require('./componentDialogs/cancelReservationDialog')
const {LuisRecognizer, QnAMaker}  = require('botbuilder-ai');
const WelcomeCard = require('./resources/adaptiveCards/Welcomecard');
const MenuCard = require('./resources/adaptiveCards/Menu.json');


class RRBOT extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState,this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState);
   
        
        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');
        

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true);

        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.qnaMaker = qnaMaker;

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

        const luisResult = await dispatchRecognizer.recognize(context)
		console.log("Test", luisResult);
        const intent = LuisRecognizer.topIntent(luisResult); 
        
        const entities = luisResult.entities;

        await this.dispatchToIntentAsync(context,intent,entities);
        
        await next();

        });

    this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });   
    this.onMembersAdded(async (context, next) => {
        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
        await context.sendActivity({ attachments: [welcomeCard] });
            await this.sendWelcomeMessage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

  

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Pasta Street Restaurant Reservation system.`; //${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Make Reservation','Cancel Reservation','Restaurant Address'],'How can I help you today?');
        await turnContext.sendActivity(reply);
    }


    async dispatchToIntentAsync(context,intent,entities){

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});   

        if(previousIntent.intentName && conversationData.endDialog === false )
        {
           currentIntent = previousIntent.intentName;

        }
        else if (previousIntent.intentName && conversationData.endDialog === true)
        {
             currentIntent = intent;

        }
        else if(intent == "None" && !previousIntent.intentName)
        {
            var result = await this.qnaMaker.getAnswers(context);
            await context.sendActivity(`${result[0].answer}`);
            await this.sendSuggestedActions(context);
        }
        else
        {
            currentIntent = intent;
            await this.previousIntent.set(context,{intentName: intent});

        }
    switch(currentIntent)
    {

        case 'Welcome':
            console.log("Inside Welcome Case");
            await this.previousIntent.set(context,{intentName: null});
            const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
            await context.sendActivity({ attachments: [welcomeCard] });
            await this.sendSuggestedActions(context);
            break;
        case 'Menu':
            console.log("Inside menu Case");
            const menuCard = CardFactory.adaptiveCard(MenuCard);
            await context.sendActivity({ attachments: [menuCard] });
            await this.previousIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
            break;
        case 'Make_Reservation':
            console.log("Inside Make Reservation Case");
            await this.conversationData.set(context,{endDialog: false});
            await this.makeReservationDialog.run(context,this.dialogState,entities);
            conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
            if(conversationData.endDialog)
            {
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);

            } 
            break;


        case 'Cancel_Reservation':
            console.log("Inside Cancel Reservation Case");
            await this.conversationData.set(context,{endDialog: false});
            await this.cancelReservationDialog.run(context,this.dialogState);
            conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
            if(conversationData.endDialog)
            {   
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
    
            }
            
            break;


        default:
            console.log("Did not match Make Reservation case");
            break;
    }


    }


}



module.exports.RRBOT = RRBOT;
