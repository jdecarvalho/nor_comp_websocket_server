import WebSocket, { WebSocketServer } from 'ws';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
interface User {
    ws: WebSocket;
    nick: String;
    isAlive: boolean;
}

interface Message {
    message_type: String;
    data: String;
    // dataArray: String[];
}

let users: User[] = [];

console.log(`Listening on port ${PORT}`);
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
    console.log('ws connected');

    ws.on('message', (data) => {
        const raw_data = data.toString();
        console.log("Received message: ", raw_data);
        try {
            const parsed_data: Message = JSON.parse(raw_data);
            switch (parsed_data.message_type) {
                case 'ComputerReset':
                    mockValues()
                    
                    setInterval(function ping() {
                        mockValues()
                    }, 1000);
                    
                    break;
                // case 'message':
                //     const sender = users.find((u) => u.ws === ws);
                //     if (sender) {
                //         broadcast(
                //             JSON.stringify({
                //                 messageType: 'message',
                //                 data: JSON.stringify({
                //                     from: sender.nick,
                //                     message: parsed_data.data,
                //                     time: Date.now(),
                //                 }),
                //             })
                //         );
                //     }
            }
        } catch (e) {
            console.log('Error in message', e);
        }
    });
});

const mockValues = () => {
    // generate a number representable by a single byte
    let rand = Math.floor(Math.random() * 256);
    // padded base-10
    let register_a_value = String(rand).padStart(4, '0');
    // padded base-2
    let register_b_value = String(rand.toString(2)).padStart(8, '0');

    // FIXME mock a register-A set event
    broadcast(JSON.stringify({
        message_type: {
            "RegisterModified": {
                "register_name": "A"
            }
        },
        data: register_a_value, //"DEADBEEF"
    }));

    // FIXME mock a register-B set event
    broadcast(JSON.stringify({
        message_type: {
            "RegisterModified": {
                "register_name": "B"
            }
        },
        data: register_b_value,
    }));

    // FIXME mock an output event
    broadcast(JSON.stringify({
        message_type: "OutputValue",
        data: JSON.stringify([
            encodeValue(parseInt(register_a_value.charAt(0))),
            encodeValue(parseInt(register_a_value.charAt(1))),
            encodeValue(parseInt(register_a_value.charAt(2))),
            encodeValue(parseInt(register_a_value.charAt(3)))
        ])
    }));
};

const encodeValue = (value: number): number[] => {
    let result: number[] = [];

    if(value == 0) {
        result = [1,1,1,1,1,1,0];
    } else if(value == 1) {
        result = [0,1,1,0,0,0,0];
    } else if(value == 2) {
        result = [1,1,0,1,1,0,1];
    } else if(value == 3) {
        result = [1,1,1,1,0,0,1];
    } else if(value == 4) {
        result = [0,1,1,0,0,1,1];
    } else if(value == 5) {
        result = [1,0,1,1,0,1,1];
    } else if(value == 6) {
        result = [1,0,1,1,1,1,1];
    } else if(value == 7) {
        result = [1,1,1,0,0,0,0];
    } else if(value == 8) {
        result = [1,1,1,1,1,1,1];
    } else if(value == 9) {
        result = [1,1,1,1,0,1,1];
    }

    return result;
};

const interval = setInterval(function ping() {
    const current_clients = Array.from(wss.clients);
    const updated_users = users.filter((u) => current_clients.includes(u.ws));
    if (updated_users.length !== users.length) {
        users = updated_users;
        broadcast(JSON.stringify({ messageType: 'users', dataArray: users.map((u) => u.nick) }));
    }
}, 5000);

const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log("Broadcasting message to '" + client + "': ", data);
            client.send(data);
        }
    });
};
