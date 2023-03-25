import { GetUserInfo } from "./getUserInfo";

class msgAndRoomListeners {
	constructor(socket: any, rooms: any, myinfo: any, mainVue: any) {
		let chtbool = 1;
		socket.on('chat_SendMessage', async function (roominfo: any) {
			const messagepanel: any = document.getElementById("mes" + roominfo.roomId);
			const chatDiv = document.createElement('div');
			if (chtbool == 0) {
				//chatDiv.setAttribute("style", "background-color: rgba(242, 242, 242, 0.2);");
				chtbool = 1;
			}
			else
				chtbool = 0;

			if (myinfo.id == roominfo.senderId) {
				chatDiv.setAttribute("class", "message outgoing-message")
				chatDiv.innerHTML = "\
				<div class='message-sender'>\
				<span>Ben</span></div>\
				<div class='message outgoing-message'>\
				<div class='message-content'>\
				<p>"+ roominfo.message + "</p></div>\
				\
				</div>"
			}
			else {
				chatDiv.setAttribute("class", "message incoming-message")
				chatDiv.innerHTML = "\
				<div class='message-sender'>\
				<span> "+ (await GetUserInfo(roominfo.senderId)).userName + "</span></div>\
				<div class='message incoming-message'>\
				<div class='message-content'>\
				<p>"+ roominfo.message + "</p></div>\
				</div>"
			}

			//chatDiv.innerText = (await GetUserInfo(roominfo.senderId)).userName + ": " + roominfo.message;
			messagepanel.appendChild(chatDiv);
			//document.getElementById("rooms")?.scrollTo(0, document.body.scrollHeight);
			//chatDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
			messagepanel.scrollTop = messagepanel.scrollHeight;
		});

		socket.on('chat_ShowChatRoom', async function (roominfo: any) {
			const roomOwnerInfo = await GetUserInfo(roominfo.roomOwnerId);
			if (roomOwnerInfo.blockedYou || roomOwnerInfo.blocked)
				return;
			const tmp = document.createElement('div');
			const item = document.createElement('div');
			tmp.appendChild(item);
			item.setAttribute("id", "d" + roominfo.roomId);
			tmp.setAttribute("id", "t" + roominfo.roomId);
			tmp.setAttribute("style", "width: 100%; margin-top: 10px; box-shadow: 20px 20px 50px rgba(0,0,0,0.5); border-radius: 50px; background: rgba(255,255,255, 0.1); owerflow: hidden; border-top: 1px solid rgba(255,255,255,0.5); border-left: 1px solid rgba(255,255,255,0.5); backdrop-filter: blur(5px);");
			if (roominfo.state == 1) {
				item.innerHTML = "<a style = 'text-decoration: none; color : black;  text-shadow: 0px 0px 10px #ffffff;' href= '#'><div>Room Owner: " + (await GetUserInfo(roominfo.roomOwnerId)).userName + "</div> <div>Room Name: " + roominfo.roomName + "</div></a>";
				const forClick = item.querySelector("a");
				/*
				const hiddendiv = document.createElement('div');
				hiddendiv.setAttribute("style", "width: 100%; height: 100%; position: absolute; z-index: 1; background-color : red;");
				hiddendiv.setAttribute("id", "hidden" + roominfo.roomId);
				hiddendiv.innerText= "sa";
				
				item.append(hiddendiv);
				*/
				forClick?.addEventListener("click", (event: any) => {
					event.preventDefault();
					socket.emit('chat_joinRoom', {
						state: 1,
						roomId: roominfo.roomId,
						roomOwnerId: roominfo.roomOwnerId,
						roomName: roominfo.roomName,
						roomPass: "",
					});
				});

			}
			else {
				item.innerHTML = "<form>  <div>Room Owner: " + (await GetUserInfo(roominfo.roomOwnerId)).userName + "</div> <div>Room Name: " + roominfo.roomName + "</div> <div><input style= 'text-align: center; border-style: none none solid none; border-width: 3px; border-color:black; background-color: transparent;' placeholder= 'Password' type = 'password'></div> <div><input style= 'border-style: none none solid none; border-width:3px; border-color:purple; border-bottom-left-radius: 50px; border-bottom-right-radius: 50px; background-color: green; padding-left: 20px; padding-right:20px;' type = 'submit' value = 'Connect Room!'></div></form>";
				const forForm = item.querySelector('form');
				const forPass: any = item.querySelector('input[type="password"]');
				forForm?.addEventListener('submit', function (event: any) {
					event.preventDefault();
					if (forPass) {
						socket.emit('chat_joinRoom', {
							state: 0,
							roomId: roominfo.roomId,
							roomOwnerId: roominfo.roomOwnerId,
							roomName: roominfo.roomName,
							roomPass: forPass.value,
						});
					}
				});
			}
			rooms.appendChild(tmp);
		});
	}
}

export default msgAndRoomListeners;