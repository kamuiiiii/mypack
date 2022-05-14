import { WebSocketServer } from "ws";
declare class Server {
    port: number;
    root: string;
    wss: WebSocketServer;
    constructor(port: number, root: string);
    start(): void;
    reload(): void;
    update(id: string): void;
}
export default Server;
