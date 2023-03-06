let inputarea = null;
let mainlog = null;
let debug_message = false;
let message = '';
let message_literal = '';
let message_checked = false;
let room_current = '';
let room_current_check = false;
let room_locations = {};
let inventory = {};


window.addEventListener('load', function() {
    inputarea = document.querySelector('#inputarea')
    mainlog= document.querySelector('#log');
    inputarea.focus();

    inputarea.addEventListener('keydown', (event) => {
        if (event.isComposing || event.keyCode === 13) {
            message = inputarea.value;
            message_handler();
            inputarea.value = '';
        }
    });

    game_start();
})

function addnewlog(text, effect) {
    let newitem = document.createElement('p');

    if (effect == 'red') {
        newitem.classList.add('big-red-text');
        text = text.toUpperCase() + '!!!';
    } else if (effect == 'message-echo') {
        newitem.classList.add('message-echo');
    } else if (effect == 'new-room') {
        newitem.classList.add('new-room');
    }
    newitem.innerHTML = text;
    mainlog.appendChild(newitem);
    mainlog.scrollTop = mainlog.scrollHeight;
}

function response_default(message_compare, func){
    if (message_checked) return;
    if (!room_current_check) return;
    if (Array.isArray(message_compare)) {
        if (message_compare.some(m => m == message)) {
            message_checked = true;
            func();
        }
    } else if (message_compare == message) {
        message_checked = true;
        func();
    }
}

function response_text_only(message_compare, response, effect = 'none') {
    response_default(message_compare, () => addnewlog(response,effect));
}

function response_function(message_compare, function_action = () => {}) {
    response_default(message_compare, () => function_action(message_literal));
}

function response_change_room(message_compare, room, response, effect = 'none') {
    response_default(message_compare, () => {addnewlog(response,effect); change_room(room);});

}

function response_has_item(message_compare, item, true_response, false_response, true_function = () => {}) {
    response_default(message_compare, () => {
        if(inventory[item]) {
            addnewlog(true_response);
            true_function();
        } else
            addnewlog(false_response);
    });

}

function response_not_have_item(message_compare, item, true_response, false_response, true_function = () => {}) {
    response_default(message_compare, () => {
        if(!inventory[item]) {
            addnewlog(true_response);
            true_function();
        } else
            addnewlog(false_response);
    });

}

function room_check(room) {
    room_current_check = (room == room_current);
}

function change_room(room, custom_response = '') {
    room_current = room;
    addnewlog(room.toUpperCase(),'new-room');
    if (custom_response == '')
        addnewlog(room_locations[room]);
    else   
        addnewlog(custom_response);

}

function combine_responses(...responses) {
    let response = [];
    for (let res of responses) response = response.concat(res);
    return response;
}

let lookaround = ['look around', 'look about', 'examine area', 'look'];
let lookaroundroom = combine_responses(lookaround,['examine room', 'look around the room', 'check room']);
let lookatcompass = combine_responses(['compass', 'look at compass', 'look compass','look at the compass','use compass','use the compass']);

room_locations = {
    'forest path' : 'A familiar forested area',
    'forest fork' : 'A fork in the road'
}

function game_start () {
    change_room('forest path', 'You wake up and find your self on a path lost in Ravenwood \
    forest. You check your pockets and surroundings and find some rope thats been cut \
    and a compass.');
}

function message_handler () {
    if (debug_message) console.log(message);
    message_literal = message;
    message = message.toLowerCase();
    message_checked = false;
    let to = response_text_only;
    let al = addnewlog;
    let func = response_function;
    let cr = change_room;
    let crto = response_change_room;
    let C = combine_responses;
    let inv = response_has_item; // in inventory
    let ninv = response_not_have_item; // not in inventory

    al(message.toUpperCase(),'message-echo');

    // default
    room_check(room_current);
    to('help','Type a command to progress');

    // STARTING AREA
    room_check('forest path');
    to(C(lookaround), 'You can see a fork in the path up ahead.' + 
        (!inventory['compass'] ? ' There is a compass on the ground.': ''));
    crto(['e','east','go east','head east','walk east'], 'forest fork',
        'You walk down the path a bit and come to a fork in the road. \
        The path goes north and south.');
    ninv(['pick up compass','take compass','grab compass','get the compass',
        'pick up the compass','take the compass','grab the compass','get compass'],
        'compass',
        'You clip the compass to your belt for easy access.',
        'You already picked the compass up.',
        () => {inventory['compass'] = true; console.log("hi");}
    );
    to(lookatcompass, inventory['compass'] ? 
            'It\'s a compass. It says the path continues to the east.' : 
            'You don\'t have a compass. Maybe there is one around here.');
    to(['get fork','pick up fork','get the fork','pick up the fork'],
        'You are not at the fork in the road yet.')
    to(['look at ropes','look ropes','look at the ropes','look the ropes','look rope','look at rope','look at the rope','look the rope'],
        'The ropes that bound your hands and feet have been cut. Wonder why who ever cut them didn\'t stick around. (or did they?)')
    to(['get rope','get the rope','grab rope','grab the rope','pick up rope','pick up the rope','take rope','take the rope'],
        'Its just some scrabs of rope that used to bind your hands and feet. You decide to just leave them on the ground.');

    // FOREST FORK
    room_check('forest fork');
    to(C(lookaround,lookatcompass),'There\'s a fork in the road that goes north and south.');
    to(['examine sharp object','look at sharp object','examine object','look at object','look object'],
        'It looks like a sea urhcin like object, very pointy');
    func(['pick up','pick up object','pick up sharp object','grab object','grab sharp object','take','take object','take'],
        m => {al('OUCH','red');al('You try to pick it up but it is too sharp')});
    crto(['enter cabin', 'go into cabin', 'go back into cabin', 'enter'],'cabin','You return inside the cabin');
    to(['examine cabin','look at cabin'],'Seems like a well built cabin');

    if (!message_checked) al('You can\'t do that');
    message = '';
}