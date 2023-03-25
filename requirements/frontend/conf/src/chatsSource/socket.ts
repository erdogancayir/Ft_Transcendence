import { Socket, io } from "socket.io-client";

class chatSocket {
	public socket: any;
	constructor(token: string) {
		const socketOptions = {
			transportOptions: {
				polling: {
					extraHeaders: {
						Authorization:
							token, // 'Bearer h93t4293t49jt34j9rferek...'
					}
				}
			}
		};
		this.socket = io('127.0.0.1:3001', socketOptions);
	}
}

export default chatSocket;