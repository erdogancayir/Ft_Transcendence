import { GetUserInfo } from "../chatsSource/getUserInfo"
import { RoomInfo } from "./joinroom";
interface userVal {
	userName: string,
	userId: number,
	userSocketId: string,
}

interface roomVal {
	roomId: number,
	roomOwnerId: number,
	roomName: string,
	roomPass?: string,
	roomUsers: userVal[],
}

class createRoom {
	constructor(socket: any, elem: any, roomName: any, roomPass: any, token: string, allitems: HTMLDivElement[], messagearr: HTMLDivElement[], rooms: any, messages: any, chats: any, usersarr: any, mainVue: any) {
		elem.addEventListener("submit", function (e: any) {
			e.preventDefault();
			if (roomName.value) {
				socket.emit('chat_CreateRoom', {
					Bearer: token,
					roomName: roomName.value,
					roomPass: roomPass.value,
				});
			}
		});

		this.createRoomListener(socket, allitems, messagearr, rooms, messages, chats, usersarr, mainVue);
	}
	async createRoomListener(socket: any, allitems: HTMLDivElement[], messagearr: HTMLDivElement[], roomsDiv: any, messagesDiv: any, chatsDiv: any, usersarr: any, mainVue: any) {
		socket.on('chat_CreateRoom', async function (roominfo: roomVal) {
			const item = document.createElement('div');
			const leave = document.createElement('div');
			const tmp = document.createElement('div');
			item.innerHTML = "<a href= '#' class= 'href'  ><div> <div>Room Owner: " + (await GetUserInfo(roominfo.roomOwnerId)).userName + "</div> <div>Room Name: " + roominfo.roomName + "</div></div></a>";
			leave.innerHTML = "<a class = 'href' href = '#'><div style = ''>Ayril!</div></a>";
			item.setAttribute("id", "d" + roominfo.roomId);

			tmp.appendChild(item);
			tmp.appendChild(leave);
			item.setAttribute("style", "margin-bottom: 5px;");
			leave.setAttribute("class", "leave");
			tmp.setAttribute("class", "w3-animate-bottom chatroomdiv");
			if (roomsDiv != null)
				roomsDiv.appendChild(tmp);
			const message = document.createElement('div');
			message.style.overflowY = "scroll";
			message.style.overflowX = "hidden";
			message.style.height = "100%";
			message.setAttribute("class", "message-container")
			message.setAttribute("id", "mes" + roominfo.roomId);
			messagearr.push(message);
			messagesDiv.appendChild(message);
			const roomvariables: roomVal = {
				roomId: roominfo.roomId,
				roomOwnerId: roominfo.roomOwnerId,
				roomName: roominfo.roomName,
				roomUsers: roominfo.roomUsers,
			}
			const chatDiv = document.createElement('div');
			const input = document.createElement('input');
			const button = document.createElement('button');
			button.innerText = "Send";
			button.setAttribute("class", "sendmessage_button");
			input.setAttribute("class", "sendmessage_input");
			chatDiv.setAttribute("class", "sendmessage_div");
			button.onclick = function () {
				if (input.value == "")
					return;
				sendMessage(input.value, roomvariables);
				input.value = '';
			};

			input.addEventListener('keydown', (event: any) => {
				if (event.keyCode === 13) {
					if (input.value == "")
						return;
					sendMessage(input.value, roomvariables);
					input.value = '';
				}
			});

			chatDiv.appendChild(input);
			chatDiv.appendChild(button);

			chatDiv.setAttribute("class", "sendmessage_div");
			input.setAttribute("class", "sendmessage_input");
			button.setAttribute("class", "sendmessage_button");
			chatsDiv.appendChild(chatDiv);

			const userschild = document.createElement('div');
			userschild.setAttribute("id", "us" + roominfo.roomId);

			// mainVue.roomsView.set(roominfo.roomId, new RoomInfo());
			// for (const user of roominfo.roomUsers) {
			// 	const userData: any = user
			// 	userData.info = await GetUserInfo(user.userId);
			// 	userData.power = 100;
			// 	mainVue.roomsView.get(roominfo.roomId)?.roomUsers.push(userData);
			// }
			// usersarr.push(userschild);

			allitems.push(chatDiv);
			chatDiv.style.display = "none";
			message.style.display = "none";
			userschild.style.display = "none";
			item.addEventListener("click", (event: any) => {
				event.preventDefault();
				let cntr = 0;
				while (allitems != undefined && allitems[cntr]) {
					allitems[cntr].style.display = "none";
					cntr++;
				}
				cntr = 0;
				while (messagearr[cntr]) {
					messagearr[cntr].style.display = "none";
					cntr++;
				}
				cntr = 0;
				while (usersarr[cntr]) {
					usersarr[cntr].style.display = "none";
					cntr++;
				}
				userschild.style.display = "block"
				message.style.display = "flex";
				chatDiv.style.display = "block";
				mainVue.activeRoom = roominfo.roomId;
				//mainVue.roomOwnerId = roominfo.roomOwnerId;
			});

			leave.addEventListener("click", (event: any) => {
				event.preventDefault();
				let cntr: number;
				cntr = -1;
				cntr = usersarr.findIndex((a: HTMLDivElement) => a === userschild)
				if (cntr != -1)
					usersarr.splice(cntr, 1);
				cntr = messagearr.findIndex((a: HTMLDivElement) => a === message)
				if (cntr != -1)
					messagearr.splice(cntr, 1);
				cntr = allitems.findIndex((a: HTMLDivElement) => a === chatDiv);
				if (cntr != -1)
					allitems.splice(cntr, 1);
				userschild.remove()
				message.remove()
				chatDiv.remove()
				tmp.remove()
				mainVue.roomsView.delete(roominfo.roomId);
				socket.emit("chat_QuitRoom", {
					roomid: roominfo.roomId,
				})
			});
		});
		function sendMessage(message: string, roomvariables: roomVal) {
			socket.emit('chat_SendMessage', {
				roomId: roomvariables.roomId,
				roomName: roomvariables.roomName,
				roomOwnerId: roomvariables.roomOwnerId,
				message: message,
			});
		}
	}
}

export default createRoom;