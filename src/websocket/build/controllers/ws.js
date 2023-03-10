// **********websocket clients**********
let wsClients = [];
// **********delete wsClient**********
function delWsClient() {
    wsClients = wsClients.filter((user) => user.ws !== this);
}
const wsHandler = (ws) => {
    wsClients.push(ws);
    // **********handlers**********
    ws.on('close', delWsClient);
    ws.on('error', delWsClient);
};
export { wsHandler, wsClients };
