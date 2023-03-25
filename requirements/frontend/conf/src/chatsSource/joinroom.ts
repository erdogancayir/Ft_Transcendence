import { GetUserInfo } from "./getUserInfo";

interface userVal {
	userId: number,
}

interface roomVal {
	roomId: number,
	roomOwnerId: number,
	roomName: string,
	roomPass?: string,
	roomUsers: userVal[],
}

export class RoomInfo {
	public roomUsers = new Array<any>();
}

class joinRoom {
	constructor(socket: any, allitems: HTMLDivElement[], messagearr: HTMLDivElement[], messages: any, chats: any, rooms: any, userarr: any, mainVue: any) {
		socket.on('chat_joinRoom', async function (roominfo: any) {
			const roomvariables: roomVal = {
				roomId: roominfo.roomId,
				roomOwnerId: roominfo.roomOwnerId,
				roomName: roominfo.roomName,
				roomUsers: roominfo.roomUsers,
			}

			const roomOwnerInfo = await GetUserInfo(roomvariables.roomOwnerId);
			if (roomOwnerInfo.blockedYou || roomOwnerInfo.blocked)
				return;

			const users = document.getElementById('userlist');
			const userschild = document.createElement('div');
			userschild.setAttribute("id", "us" + roominfo.roomId);

			//mainVue.roomsView.set(roominfo.roomId, new RoomInfo());
			//for (const user of roominfo.roomUsers) {
			// 	const tmp = document.createElement('div');
			// 	//tmp.innerText = (await GetUserInfo(roominfo.roomUsers[nnn].userId)).userName;
			// 	//userschild.appendChild(tmp);
			// 	user.info = await GetUserInfo(user.userId);
			// 	mainVue.roomsView.get(roominfo.roomId)?.roomUsers.push(user);
			//}

			// if (users)
			// 	users.appendChild(userschild);
			//oooo

			const roompanel: any = document.getElementById("d" + roominfo.roomId);
			const message = document.createElement('div');

			message.style.overflowY = "scroll";
			message.style.overflowX = "hidden";
			message.style.height = "100%";
			message.style.display = "none";
			message.setAttribute("class", "message-container")
			message.setAttribute("id", "mes" + roominfo.roomId);
			messagearr.push(message);
			messages.appendChild(message);

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
			chats.appendChild(chatDiv);

			chatDiv.style.display = "none";
			allitems.push(chatDiv);

			userarr.push(userschild);
			userschild.style.display = "none";
			if (roompanel) {
				const leave = document.createElement('div');
				const tmp = document.getElementById("t" + roominfo.roomId);
				leave.innerHTML = "<a class = 'href' href = '#'><div>Ayril!</div></a>";
				roompanel.innerHTML = "<a href = '#' class= 'href' > <div> <div> RoomOwner: " + (await GetUserInfo(roominfo.roomOwnerId)).userName + " </div> <div> RoomName: " + roominfo.roomName + " </div> </div> </a>";

				const hiddendiv = document.getElementById("hidden" + roominfo.roomId);
				hiddendiv?.remove();

				roompanel.setAttribute("style", "margin-bottom: 5px;");
				leave.setAttribute("class", "leave");
				leave.setAttribute("id", "leave" + roominfo.roomId);
				tmp?.setAttribute("class", "chatroomdiv");
				tmp?.appendChild(leave);
				roompanel.addEventListener("click", (event: any) => {
					event.preventDefault();
					let cntr = 0;
					while (allitems[cntr]) {
						allitems[cntr].style.display = "none";
						cntr++;
					}
					cntr = 0;
					while (messagearr[cntr]) {
						messagearr[cntr].style.display = "none";
						cntr++;
					}
					cntr = 0;
					while (userarr[cntr]) {
						userarr[cntr].style.display = "none";
						cntr++;
					}
					userschild.style.display = "block";
					message.style.display = "flex";
					chatDiv.style.display = "block";
					mainVue.activeRoom = roominfo.roomId;
					//mainVue.roomOwnerId = roominfo.roomOwnerId;
				});

				leave.addEventListener("click", (event: any) => {
					event.preventDefault();
					let cntr: number;
					cntr = -1;
					cntr = userarr.findIndex((a: HTMLDivElement) => a === userschild)
					if (cntr != -1)
						userarr.splice(cntr, 1);
					cntr = messagearr.findIndex((a: HTMLDivElement) => a === message)
					if (cntr != -1)
						messagearr.splice(cntr, 1);
					cntr = allitems.findIndex((a: HTMLDivElement) => a === chatDiv);
					if (cntr != -1)
						allitems.splice(cntr, 1);
					userschild.remove()
					message.remove()
					chatDiv.remove()

					leave.remove()
					roompanel.remove()
					tmp?.remove();
					mainVue.roomsView.delete(roominfo.roomId)
					socket.emit("chat_QuitRoom", {
						roomid: roominfo.roomId,
					})
				});
			}
			else {
				const tmp = document.createElement('div');
				const roompan = document.createElement('div');
				const leave = document.createElement('div');

				const setPassDiv = document.createElement('div');

				roompan.innerHTML = "<a href = '#' style = 'text-decoration: none; color : black;  text-shadow: 0px 0px 10px #ffffff;' > <div> <div> RoomOwner: " + (await GetUserInfo(roominfo.roomOwnerId)).userName + " </div> <div> RoomName: " + roominfo.roomName + " </div> </div> </a>";
				leave.innerHTML = "<a style='text-decoration: none; color : black; text-shadow: 0px 0px 10px #ffffff; width: 100%;' href = '#'><div>Ayril!</div></a>";
				leave.setAttribute("id", "leave" + roominfo.roomId);
				roompan.setAttribute("style", "margin-bottom: 5px;");
				leave.setAttribute("class", "leave");
				tmp?.setAttribute("class", "chatroomdiv");
				tmp?.appendChild(leave);

				tmp.appendChild(roompan);
				tmp.appendChild(leave);
				rooms.appendChild(tmp);

				roompan.addEventListener("click", (event: any) => {
					event.preventDefault();

					let cntr = 0;
					while (allitems[cntr]) {
						allitems[cntr].style.display = "none";
						cntr++;
					}
					cntr = 0;
					while (messagearr[cntr]) {
						messagearr[cntr].style.display = "none";
						cntr++;
					}
					cntr = 0;
					while (userarr[cntr]) {
						userarr[cntr].style.display = "none";
						cntr++;
					}
					userschild.style.display = "block";
					message.style.display = "flex";
					chatDiv.style.display = "block";
					mainVue.activeRoom = roominfo.roomId;
					//mainVue.roomOwnerId = roominfo.roomOwnerId;
				});
				leave.addEventListener("click", (event: any) => {
					event.preventDefault();
					let cntr: number;
					cntr = -1;
					cntr = userarr.findIndex((a: HTMLDivElement) => a === userschild)
					if (cntr != -1)
						userarr.splice(cntr, 1);
					cntr = messagearr.findIndex((a: HTMLDivElement) => a === message)
					if (cntr != -1)
						messagearr.splice(cntr, 1);
					cntr = allitems.findIndex((a: HTMLDivElement) => a === chatDiv);
					if (cntr != -1)
						allitems.splice(cntr, 1);
					tmp.remove()
					userschild.remove()
					message.remove()
					chatDiv.remove()
					leave.remove()
					roompan.remove()
					mainVue.roomsView.delete(roominfo.roomId);
					socket.emit("chat_QuitRoom", {
						roomid: roominfo.roomId,
					})
				});
			}
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
export default joinRoom;