const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const {CardFactory} = require('botbuilder');

const RestaurantCard = require('../resources/adaptiveCards/Restaurantcard')

const CARDS = [

    RestaurantCard
];

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

class CancelReservationDialog extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        super('cancelReservationDialog');



this.addDialog(new TextPrompt(TEXT_PROMPT));
this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
this.addDialog(new NumberPrompt(NUMBER_PROMPT));
this.addDialog(new DateTimePrompt(DATETIME_PROMPT));


this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
    this.firstStep.bind(this),  // Ask confirmation if user wants to make reservation?
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
    this.summaryStep.bind(this)
           
]));




this.initialDialogId = WATERFALL_DIALOG;


   }

   async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
        await dialogContext.beginDialog(this.id);
    }
}

async firstStep(step) {
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
// await step.context.sendActivity({
//     text: 'Enter reservation id for cancellation:',
//     attachments: [CardFactory.adaptiveCard(CARDS[0])]
// });
await step.context.sendActivity({
        attachments: [CardFactory.adaptiveCard(CARDS[0])]
    });
//await step.context.sendActivity([CardFactory.adaptiveCard(CARDS[0])]);
var tempStore = process.env.reservationRandom == '' ? 9191 :  process.env.reservationRandom;
return await step.prompt(CONFIRM_PROMPT, `As per our record, your latest reservation id is ${tempStore}. Do you want to cancel reservation for the same?`, ['yes', 'no']);

//return await step.prompt(TEXT_PROMPT, '');
      
}

async confirmStep(step){

    if(step.result===true)
    {
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that you want to CANCEL the reservation?', ['yes', 'no']);
    } 
    if(step.result === false)
    { 
        await step.context.sendActivity("You choose not to go ahead with cancellation.");
        endDialog = true;
        return await step.endDialog(); 
    }


    
}
// async confirmStep(step){

//     step.values.reservationNo = step.result

//     var msg = `You have entered the following values: \n Reservation Number: ${step.values.reservationNo}`

//     await step.context.sendActivity(msg);

//     return await step.prompt(CONFIRM_PROMPT, 'Are you sure that you want to CANCEL the reservation?', ['yes', 'no']);
// }

async summaryStep(step){

    if(step.result===true)
    {
      // Business 
      await step.context.sendActivity('Reservation successfully canceled.');
      await step.context.sendActivity("We wish you come back soon and give us a chance to serve you.");
      endDialog = true;
      return await step.endDialog();   
    
    }
    if(step.result === false)
    { 
        await step.context.sendActivity("You choose not to cancel the reservation. Enjoy your delicious food.");
        endDialog = true;
        return await step.endDialog();   
    }  
}

async isDialogComplete(){
    return endDialog;
}
}

module.exports.CancelReservationDialog = CancelReservationDialog;








