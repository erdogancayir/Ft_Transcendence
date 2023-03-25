<template>
	<div class="abou w3-animate-zoom"
		style="width:100%; height: 100%; position: absolute; top: 0px; display: flex; overflow: hidden;">
		<div style="left: 0px; width: 25%; max-width: 25%; min-width: 30%; height: 100%; background-color:#a3d0ff; ">
			<div class="form-container">
				<form id="createroom">
					<div class="form-field">
						<input id="roomname"
							style=" background-color: rgba(200, 255, 100, 0.4); border-style: none none solid none; border-color: purple; text-align: center; padding-left: 15px; padding-right: 15px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;  "
							placeholder="Room Name" type="text" autocomplete="off" />
					</div>
					<div class="form-field">
						<input id="roompass"
							style=" background-color: rgba(200, 255, 100, 0.4); border-style: none none solid none; border-color: purple; text-align: center; padding-left: 15px; padding-right: 15px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;"
							placeholder="Room Password" type="password" autocomplete="off" />
					</div>
					<button
						style="background-color: green; border-style: none none solid none; border-color: purple; text-align: center; padding-left: 15px; padding-right: 15px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;"
						id="createbut">Create Room</button>
				</form>
			</div>
			<div style="left: 0px; padding-bottom: 200px; width: 100%; background-color: #7292b5; height: 100%; overflow-y: scroll;"
				id="rooms"></div>
		</div>
		<div
			style="width: 75%; min-height: 100%; max-height: 100%; background-color: #d9ebff; display: flex; flex-direction: column;">
			<div class="chatbg" style="height: 80%; width: 100%; box-shadow: 0px 0px 10px; background-color: white;"
				id="messages">
				<div id="userlist" style="float:right; background-color: transparent; width: 20%; height: 100%;">
					<div v-if="roomsView.has(activeRoom) && me.power == 100">
						<input v-model="inputNewRoomPassword" type="password" placeholder="new Password">
						<button @click="ChangeRoomPassword()">change room password</button>
						<hr>
					</div>
					Users
					<hr>
					<div v-for="(user) in roomsView.get(activeRoom)?.roomUsers" :key="user?.userId">
						{{ user.power }}
						<span @click="$router.push({ path: '/profile/' + user.info.id })">{{
							user.info.firstName }}</span>
						<span v-if="me.power > user.power">
							<button
								@click="lastClickedBanUserId = user.userId ; banTimeQuestionVisibility = true">Ban</button>
							<button v-if="me.power == 100 && user.power != 10"
								@click="GivePower(user.userId, 10)">Mod</button>
							<button v-if="me.power == 100 && user.power == 10"
								@click="GivePower(user.userId, 0)">UnMod</button>
							<button @click="ModeratorProcessKick(user.userId)">Kick</button>
							<button v-if="me.power > user.power && user.muted != 1"
								@click="ModeratorProcessMute(user.userId); user.muted = 1;">Mute</button>
							<button v-if="me.power > user.power && user.muted == 1"
								@click="ModeratorProcessUnMute(user.userId); user.muted = 0;">UnMute</button>
						</span>
						<button v-if="user.userId != me.userId" @click="gameTry(me.userId, user.userId)">Invite</button>
						<br>
						<br>
						<hr>
					</div>
				</div>
			</div>
			<div style="width: 100%; min-height: 20%;" id="chats"></div>
		</div>

		<div v-if="banTimeQuestionVisibility" class="w3-dropdown-content w3-animate-zoom w3-show w3-card-4"
			style="width:400px;  position: absolute;top: 50%;left: 50%;margin-top: -200px; margin-left: -200px;">
			<button v-on:click="banTimeQuestionVisibility = false" class="w3-button w3-red w3-right"
				style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i
					class="fa fa-close w3-large"></i></button>
			<input type="number" v-model="inputBanTime">
			<br>
			<button @click="ModeratorProcessBan(inputBanTime)">Ban Selected User</button>
		</div>

	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();
import createRoom from "../chatsSource/createroom"
import joinRoom, { RoomInfo } from "../chatsSource/joinroom"
import msgAndRoomListeners from "../chatsSource/msgAndRoomListeners"
import { GetUserInfo } from '@/chatsSource/getUserInfo';
import jwt_decode from "jwt-decode";

interface userVal {
	userId: number,
}

interface roomVal {
	roomOwnerId: number,
	roomName: string,
	roomPass?: string,
	roomUsers: userVal[],
}

interface joinRoomVal {
	State: number,
	roomOwnerId: number,
	roomName: string,
	roomPass: string,
}

export default defineComponent({
	data() {
		return {
			global: this.$global as any,
			cssFile: require("../css/main.css"),
			roomsView: new Map() as Map<number, RoomInfo>,
			activeRoom: -1,
			inputBanTime: 10,
			banTimeQuestionVisibility: false,
			lastClickedBanUserId: 0,
			me: undefined as any,
			inputNewRoomPassword: "",
		}
	},

	watch: {
		'activeRoom': function (newValue) {
			const decoded: any = jwt_decode(cookies.get("token"));
			this.me = this.roomsView.get(newValue)?.roomUsers.find((user) => user.userId === decoded.id);
		},
	},

	beforeMount() {
		if (cookies.get("token") == null) {
			this.$router.push({ path: '/' });
			return;
		}
		setTimeout(this.Setup, 50);
	},

	methods: {
		ChangeRoomPassword() {
			this.global.socket.emit("chat_changeRoomPassword", {
				jwtToken: cookies.get("token"),
				newPassword: this.inputNewRoomPassword,
				roomId: this.activeRoom,
			});
		},

		GivePower(userId: number, power: number) {
			this.global.socket.emit("chat_GivePower", { roomId: this.activeRoom, userId: userId, power: power, jwtToken: cookies.get("token") });
		},

		ModeratorProcessKick(kickUserId: number) {
			this.global.socket.emit("chat_kick", {
				jwtToken: cookies.get("token"),
				kickUserId: kickUserId,
				roomId: this.activeRoom,
			});

		},

		ModeratorProcessBan(banTime: number) {
			this.global.socket.emit("chat_ban", {
				jwtToken: cookies.get("token"),
				banUserId: this.lastClickedBanUserId,
				banTime: banTime,
				roomId: this.activeRoom,
			});
		},
		ModeratorProcessMute(userId: any) {
			this.global.socket.emit("chat_Mute", {
				userId: userId,
				roomId: this.activeRoom,
			});
		},

		gameTry(myid: any, userid: any) {
			this.global.socket.emit("game_createRoom", { jwtToken: cookies.get("token"), speedBoost: 0, myid: myid, userid: userid });
		},

		ModeratorProcessUnMute(userId: any) {
			this.global.socket.emit("chat_unMute", {
				userId: userId,
				roomId: this.activeRoom,
			});
		},
		async Setup() {
			var allitems: HTMLDivElement[] = [];
			var messagearr: HTMLDivElement[] = [];
			var usersarr: HTMLDivElement[] = [];

			const myinfo: any = jwt_decode(cookies.get("token"));
			new createRoom(this.global.socket, document.getElementById("createroom"), document.getElementById("roomname"),
				document.getElementById("roompass"), cookies.get("token"), allitems, messagearr, document.getElementById("rooms"),
				document.getElementById('messages'), document.getElementById('chats'), usersarr, this);
			new joinRoom(this.global.socket, allitems, messagearr, document.getElementById('messages'), document.getElementById('chats'), document.getElementById("rooms"), usersarr, this);
			new msgAndRoomListeners(this.global.socket, document.getElementById("rooms"), myinfo, this);

			this.global.socket.emit("chat_ShowChatRoom", "sa");

			this.global.socket.on('chat_socketAlert', async (info: any) => {
				alert(info.msg);
			});

			this.global.socket.on('chat_kickServer', async (info: any) => {
				document.getElementById("leave" + info.roomId)?.click();
				alert("You Are Kicked From Room " + info.roomName);
			});

			this.global.socket.on('chat_bannedServer', async (info: any) => {
				document.getElementById("leave" + info.roomId)?.click();
				this.roomsView.delete(info.roomId);

				alert("You Are Banned From Room " + info.roomName + "\nBan Time: " + info.banTime);
			});

			this.global.socket.on('chat_RoomDeleted', async (data: any) => {
				document.getElementById("t" + data.roomId)?.remove();
			});

			this.global.socket.on("chat_roomUserUpdate", async (data: any) => {
				this.roomsView.set(data.id, new RoomInfo());
				const room = this.roomsView.get(data.id) as RoomInfo;
				const tmp = new Array<any>();
				for (const user of data.chatUsers) {
					tmp.push({
						info: await GetUserInfo(user.chatUserId),
						userId: user.chatUserId,
						power: user.power,
					});
				}
				room.roomUsers = tmp;
				const decoded: any = jwt_decode(cookies.get("token"));
				this.me = this.roomsView.get(this.activeRoom)?.roomUsers.find((user) => user.userId === decoded.id);
			})
			this.global.socket.on("chat_invitein", async (data: any) => {

				this.global.socket.emit("chat_davet", { GameroomId: data.roomId, GameRoomPass: data.roomPassword, myid: data.myid, userid: data.userid, _customer: "false" });
			});

			this.global.socket.on("chat_davet", async (data: any) => {
				let _url: any;
				const container = document.createElement("div");
				const yes = document.createElement("button");
				const no = document.createElement("button");
				document.getElementById("rooms")?.appendChild(container);
				yes.innerHTML = "Kabul Ediyorum!";
				no.innerText = "Reddediyorum!";
				container.appendChild(yes);
				container.appendChild(no);
				yes.addEventListener("click", (_data: any) => {
					const url = new URL(window.location.href);
					const link = url.origin + url.pathname;
					_url = "/game";
					//GameroomId : data.GameroomId, GameRoomPass : data.GameRoomPass, inviter : data.myid, _customer: "false", userid: data.userid }
					this.global.socket.emit("chat_davet", { GameroomId: data.GameroomId, GameRoomPass: data.GameRoomPass, inviter: data.inviter, _customer: "true", userid: data.userid })
					const query = { roomId: data.GameroomId, roomPassword: data.GameRoomPass };
					this.$router.push({ path: _url, query: query });
					container.remove();
				})
				no.addEventListener("click", (data: any) => {
					container.remove();
				})
			})
			this.global.socket.on("canodis", async (data: any) => {
				console.log("_customer geldi");
				let _url = "/game";
				const query = { isChat: "true", roomId: data.GameroomId, roomPassword: data.GameRoomPass };
				this.$router.push({ path: _url, query: query });
			})
		}
	}
});
</script>

<style scoped>
.container {
	display: flex;
	position: fixed;
	width: 100%;
	height: 100%;
}

.deneme {
	padding-left: 5px;
}
</style>
