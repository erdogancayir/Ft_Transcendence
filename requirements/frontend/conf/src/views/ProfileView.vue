<template>
  <div class="about w3-animate-zoom">
    
    <!-- DM -->
    <div v-if="DMVisibility" class="w3-dropdown-content w3-show w3-card-4"
      style="max-width:750px; width: 100%; position: fixed;top: 50%;left: 50%; transform: translate(-50%, -50%);">
      <button v-on:click="DMVisibility = false" class="w3-button w3-red w3-right"
        style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i class="fa fa-close w3-large"></i></button>

      <ul class="w3-ul w3-right" style="height: 500px; width: 100%; ">

        <div style="float: left; width: 30%; height: 100%;overflow-y: scroll;">
          <li v-on:click="activeDmBox = dmBox[0]; dmBox[1].notification = false"
            :style="{ backgroundColor: dmBox[1].notification ? '#ffc3ad' : 'white' }" v-for="(dmBox) in dmBoxes"
            :key="dmBox[0]" class="w3-bar">
            <img v-on:click="OpenProfile(dmBox[0])" :src="image_url + tmpUsers.get(dmBox[0]).profilePicture"
              class="w3-bar-item w3-circle" style="width: 85px;height:85px;object-fit: cover;">
            {{ tmpUsers.get(dmBox[0]).userName }}
          </li>
        </div>
        <div style="float: left; width: 70%; height: 100%;">
          <div
            style=" height: 450px; overflow-y: scroll;width: 100%; box-shadow: -10px 0px 10px 0px #aaaaaa; padding-bottom: 30px">
            <li :style="{ backgroundColor: message.me ? 'white' : '#e3ffe3' }"
              v-for="(message) in dmBoxes.get(activeDmBox)?.messages" :key="message.id" class="w3-bar">
              {{ message.me ? "me: " : tmpUsers.get(activeDmBox).userName + ": " }}
              {{ message.content }}
            </li>
          </div>
          <div v-if="dmBoxes.has(activeDmBox)">
            <input type="text" class="w3-bar-item w3-input w3-white " v-model="dmMessageInput"
              style=" width: 85%; float: left;" placeholder="User Name..">
            <button :class="(dmMessageInput == '') ? 'w3-disabled' : ''"
              v-on:click="SendDmMessage(dmMessageInput, activeDmBox)" class="w3-bar-item w3-button w3-green"
              style="width: 15%;float: left;"><i class="glyphicon glyphicon-send w3-large"></i></button>
          </div>
        </div>
      </ul>
    </div>

    <!-- game history -->
    <div v-if="gameHistoryVisibility" class="w3-dropdown-content w3-animate-zoom w3-show w3-card-4"
      style="width:400px;  position: absolute;top: 50%;left: 50%;margin-top: -200px; margin-left: -200px;">
      <button v-on:click="gameHistoryVisibility = false" class="w3-button w3-red w3-right"
        style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i class="fa fa-close w3-large"></i></button>
      <ul class="w3-ul w3-right" style="max-height: 500px; width: 100%; overflow-y: scroll;">
        <li class="w3-bar" v-if="gameHistory.length == 0">
          <div class="w3-bar-item ">
            <span style="float: left;">Played game not found!</span>
          </div>
        </li>

        <li v-on:click="OpenProfile(game.otherUserId)" :style="{ backgroundColor: game.won ? '#b5ffb8' : '#ffa7a1' }"
          v-for="(game) in gameHistory" :key="game?.id" class="w3-bar">
          <div class="w3-bar-item ">
            <span class="w3-large" style="float: left;margin-left: 10px;"> (you vs {{ game.otherUserInfo.userName }})
              Score {{ game.myScore }} - {{ game.otherUserScore }} </span>
            <br>
            <span style="float: left;">{{ game.matchDate }}</span>

          </div>
        </li>
      </ul>
    </div>

    <!-- friend list -->
    <div v-if="friendsVisibility" class="w3-dropdown-content w3-animate-zoom w3-show w3-card-4"
      style="width:400px;  position: absolute;top: 50%;left: 50%;margin-top: -200px; margin-left: -200px;">
      <button v-on:click="friendsVisibility = false" class="w3-button w3-red w3-right"
        style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i class="fa fa-close w3-large"></i></button>
      <ul class="w3-ul w3-right" style="max-height: 500px; width: 100%; overflow-y: scroll;">
        <li class="w3-bar" v-if="friends.length == 0">
          <div class="w3-bar-item ">
            <span style="float: left;">You have no friends!</span>
          </div>
        </li>

        <li :style="{ backgroundColor: friend.friendState == 3 ? 'white' : '#cafcca' }" v-for="(friend) in friends"
          :key="friend?.id" class="w3-bar">
          <img v-on:click="OpenProfile(friend.id)" :src="image_url + friend.profilePicture" class="w3-bar-item w3-circle"
            style="width: 85px;height:85px;object-fit: cover;">
          <div class="w3-bar-item ">
            <span class="w3-large" style="float: left;margin-left: 10px;">{{ friend.firstName }} {{
              friend.lastName }}</span>
            <br>
            <span style="float: left;">{{ friend.email }}</span>

          </div>
          <button v-on:click="FriendProcess(2/*FriendProcessType.deleteFriend*/, friend.id)"
            class="w3-button w3-red w3-right" style="font-weight: bold; "><i class="fa fa-trash w3-large"></i></button>
          <button v-if="friend.friendState == 2/*FriendState.decision*/"
            v-on:click="FriendProcess(1/*FriendProcessType.acceptInvite*/, friend.id)" class="w3-button w3-green w3-right"
            style="font-weight: bold; "><i class="glyphicon glyphicon-ok"></i></button>
        </li>
      </ul>
    </div>

    <!-- blocked users list -->
    <div v-if="blockedUsersVisibility" class="w3-dropdown-content w3-animate-zoom w3-show w3-card-4"
      style="width:400px;  position: absolute;top: 50%;left: 50%;margin-top: -200px; margin-left: -200px;">
      <button v-on:click="blockedUsersVisibility = false" class="w3-button w3-red w3-right"
        style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i class="fa fa-close w3-large"></i></button>
      <ul class="w3-ul w3-right" style="max-height: 500px; width: 100%; overflow-y: scroll;">
        <li class="w3-bar" v-if="blockedUsers.length == 0">
          <div class="w3-bar-item ">
            <span style="float: left;">You have no blocked users!</span>
          </div>
        </li>

        <li v-for="(blockedUser) in blockedUsers" :key="blockedUser?.id" class="w3-bar">
          <img v-on:click="OpenProfile(blockedUser.id)" :src="image_url + blockedUser.profilePicture"
            class="w3-bar-item w3-circle" style="width: 85px;height:85px;object-fit: cover;">
          <div class="w3-bar-item ">
            <span class="w3-large" style="float: left;margin-left: 10px;">{{ blockedUser.firstName }} {{
              blockedUser.lastName }}</span>
            <br>
            <span style="float: left;">{{ blockedUser.email }}</span>

          </div>
          <button v-on:click="BlockUserProcess(false, blockedUser.id)" class="w3-button w3-yellow w3-right"
            style="font-weight: bold; ">Unblock</button>
        </li>
      </ul>
    </div>

    <!-- search bar -->
    <div class="" style="margin: auto; width: 400px;margin-top: 30px;">
      <input type="text" class="w3-bar-item w3-input w3-white " v-model="searchBarValue"
        style=" width: 350px; float: left;" placeholder="User Name..">
      <button :class="(searchBarValue == '') ? 'w3-disabled' : ''" v-on:click="Search()"
        class="w3-bar-item w3-button w3-green" style="width: 50px;float: left;"><i
          class="fa fa-search w3-large"></i></button>

      <!-- search view -->
      <div v-if="searchResultsVisibility" class="w3-dropdown-content w3-animate-zoom w3-show w3-card-4"
        style="width: 400px; position: absolute;margin-top: 38.5px;">
        <button v-on:click="searchResultsVisibility = false" class="w3-button w3-red w3-right"
          style="font-weight: bold; margin-top: 15px;margin-right: 15px; "><i class="fa fa-close w3-large"></i></button>
        <ul class="w3-ul  w3-right" style="max-height: 500px; width: 100%; overflow-y: scroll;">
          <li class="w3-bar" v-if="searchResults.length == 0">
            <div class="w3-bar-item ">
              <span style="float: left;">Not match any user!</span>
            </div>
          </li>

          <li v-on:click="OpenProfile(searchResult.id)" v-for="(searchResult) in searchResults" :key="searchResult?.id"
            class="w3-bar">
            <img :src="image_url + searchResult.profilePicture" class="w3-bar-item w3-circle"
              style="width: 85px;height:85px;object-fit: cover;">
            <div class="w3-bar-item ">
              <span class="w3-large" style="float: left;margin-left: 10px;">{{ searchResult.firstName }} {{
                searchResult.lastName }}</span>
              <br>
              <span style="float: left;">{{ searchResult.email }}</span>
            </div>
          </li>
        </ul>
      </div>

    </div>
    <br>
    <br>
    <!-- profile info -->
    <h1 style="text-align: center;"> {{ info?.firstName }}'s Profile page</h1>
    <div class="w3-card-4" style="max-width:800px; margin: auto;border-radius: 30px; overflow: hidden;">
      <div class="w3-display-container w3-text-white">
        <img :src="info == undefined ? '' : image_url + info?.profilePicture" style="width:100%">
        <button v-if="me" v-on:click="UploadImagePanel()" class="w3-display-bottomright w3-button w3-large w3-teal"
          style="margin: 15px;">+</button>
      </div>
      <div class="w3-container" style="text-align: left;margin: 15px; text-shadow: 0px 0px 10px #104147;">
        <div v-if="!info?.blocked">
          <button v-if="me" v-on:click="ShowFriends()" class="w3-button w3-large w3-green"
            style="float: right">Friends</button>

          <button v-if="me" v-on:click="ShowBlockedUsers()" class="w3-button w3-large w3-red"
            style="float: right;margin-right: 5px;">Blocked Users</button>

          <button v-if="me" v-on:click="DMVisibility = true" class="w3-button w3-large w3-orange"
            style="float: right;margin-right: 5px;">DM</button>

          <button v-if="!me && info?.state == 1 /*State.online*/" v-on:click="CreateDmBox(info?.id)"
            class="w3-button w3-large w3-orange" style="float: right;margin-right: 5px;margin-left: 5px">Message</button>

          <button v-if="info?.friendState == 0/*FriendState.none*/"
            v-on:click="FriendProcess(0/*FriendProcessType.addInvite*/)" class="w3-button w3-large w3-teal"
            style="float: right; margin-left: 5px">Invite Friend</button>

          <button v-if="info?.friendState == 0/*FriendState.none*/" v-on:click="BlockUserProcess(true)"
            class="w3-button w3-large w3-red" style="float: right">Block</button>

          <button v-if="info?.friendState == 2/*FriendState.decision*/"
            v-on:click="FriendProcess(1/*FriendProcessType.acceptInvite*/)" class="w3-button w3-large w3-green"
            style="float: right">Accept Invite</button>

          <button v-if="info?.friendState == 1/*FriendState.waitingRequest*/"
            v-on:click="FriendProcess(2/*FriendProcessType.deleteFriend*/)" class="w3-button w3-large w3-yellow"
            style="float: right">Invited</button>

          <button v-if="info?.friendState == 3/*FriendState.accepted*/"
            v-on:click="FriendProcess(2/*FriendProcessType.deleteFriend*/)" class="w3-button w3-large w3-red"
            style="float: right">Remove Friend</button>
        </div>
        <div v-if="info?.blocked">
          <button v-if="info?.friendState == 0/*FriendState.none*/" v-on:click="BlockUserProcess(false)"
            class="w3-button w3-large w3-red" style="float: right">Unblock</button>
        </div>
        <h3> User Info </h3>
        <b>Name: </b>{{ info?.firstName }} {{ info?.lastName }}
        <br>
        <b>User Name: </b>{{ info?.userName }}
        <br>
        <b>Email: </b>{{ info?.email }}
        <br>
        <span v-if="!me"><b>Sate: </b> <span :style="{ color: info?.userStateColor }">{{ info?.userState }}</span></span>
        <br>
        <h3> Game Statistic </h3>
        <b>Rank: </b>
        <img :src="info == undefined ? '' : info?.rankImage" style="width:100px;">
        <br>
        <button v-if="me" v-on:click="ShowGameHistory()" class="w3-button w3-large w3-green" style="float: right">Game
          History</button>
        <b>Win Count: </b>{{ info?.winCount }}
        <br>
        <b>Loss Count: </b>{{ info?.lossCount }}
        <br>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();
import axios from 'axios'

export enum State {
  offline,
  online,
  inGame
}

enum FriendProcessType {
  addInvite,
  acceptInvite,
  deleteFriend,
}

enum FriendState {
  none,
  waitingRequest,
  decision,
  accepted,
}

class MessageInfo {
  private static idCounter = 0;
  constructor(content: string, me: boolean) {
    this.me = me;
    this.content = content;
    this.id = MessageInfo.idCounter;
    MessageInfo.idCounter++;
  }
  public id: number;
  public me: boolean;
  public content: string;
}

class DmBox {
  public SetNotification(notification: boolean) {
    this.notification = notification
  }
  public notification = false;
  public messages = [] as Array<MessageInfo>;
}

export default defineComponent({
  data() {
    return {
      global: this.$global as any,
      info: undefined as any,
      me: false,
      otherUserId: 0,
      searchResultsVisibility: false,
      searchResults: [] as Array<any>,
      searchBarValue: "",
      friendsVisibility: false,
      friends: [] as Array<any>,
      blockedUsersVisibility: false,
      blockedUsers: [] as Array<any>,
      gameHistoryVisibility: false,
      gameHistory: [] as Array<any>,
      DMVisibility: false,
      dmBoxes: new Map() as Map<number, DmBox>,
      activeDmBox: -1,
      dmMessageInput: "",
      tmpUsers: new Map() as Map<number, any>,
      image_url: process.env.VUE_APP_BACKEND_URL + "/files/file/",
      ranks: [
        require('../assets/ranks/0.png'),
        require('../assets/ranks/1.png'),
        require('../assets/ranks/2.png'),
        require('../assets/ranks/3.png'),
        require('../assets/ranks/4.png'),
        require('../assets/ranks/5.png'),
        require('../assets/ranks/6.png'),
        require('../assets/ranks/7.png'),
        require('../assets/ranks/8.png'),
        require('../assets/ranks/9.png'),
        require('../assets/ranks/10.png'),
        require('../assets/ranks/11.png'),
        require('../assets/ranks/12.png'),
        require('../assets/ranks/13.png'),
        require('../assets/ranks/14.png'),
      ],
    };
  },
  watch: {
    '$route.params.userId'(newValue) {
      if (this.$route.name != "profile")
        return;
      var id: string | null = newValue as string;
      this.me = (id == "me");
      this.otherUserId = +id;
      this.GetUserData();
    }
  },
  beforeMount() {
    if (cookies.get("token") == null) {
      this.$router.push({ path: '/' });
      return;
    }
    var id: string | null = this.$route.params.userId as string;
    this.me = (id == "me");
    this.otherUserId = +id;
    setTimeout(this.GetUserData, 50);
    setTimeout(this.DmSetup, 50);
  },
  methods: {
    async DmSetup() {
      this.global.socket.on("chat_dm", async (data: any) => {
        if (!this.dmBoxes.has(data.id)) {
          await this.SaveUserDataWithId(data.id);
          this.dmBoxes.set(data.id, new DmBox());
        }
        this.dmBoxes.get(data.id)?.messages.push(new MessageInfo(data.message, false));
        if (!(this.DMVisibility && this.activeDmBox == data.id))
          this.dmBoxes.get(data.id)?.SetNotification(true);
      });
    },

    async SendDmMessage(message: string, targetId: number) {
      if (this.dmMessageInput == "")
        return;
      this.dmMessageInput = "";
      this.dmBoxes.get(targetId)?.SetNotification(false);
      this.global.socket.emit("chat_dm", { message: message, targetId: targetId, jwtToken: cookies.get("token") }, async (data: any) => {
        if (data == "ok")
          this.dmBoxes.get(targetId)?.messages.push(new MessageInfo(message, true));
        else
          alert("The user no active!");
      });
    },

    async CreateDmBox(targetId: number) {
      if (!this.dmBoxes.has(targetId)) {
        await this.SaveUserDataWithId(targetId);
        this.dmBoxes.set(targetId, new DmBox());
      }
      this.activeDmBox = targetId;
      this.DMVisibility = true;
      for (let i = 0; i < 100; i++) {
        this.dmBoxes.get(1)?.messages.push(new MessageInfo("messagasdasdasde", Math.random() < 0.5));
      }
    },

    async BlockUserProcess(this: any, block: boolean, friendId: number = this.info?.id) {
      await fetch(process.env.VUE_APP_BACKEND_URL + '/users/blockProcess?blockId=' + friendId + '&block=' + block, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      if (friendId == this.info?.id)
        setTimeout(this.GetUserData, 50);
      else
        setTimeout(this.ShowBlockedUsers, 50);
    },
    async ShowGameHistory() {
      var userResponse = await fetch(process.env.VUE_APP_BACKEND_URL + '/users/gameHistory', {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      this.gameHistory = await userResponse.json();
      this.gameHistoryVisibility = true;
    },

    async FriendProcess(this: any, type: FriendProcessType, friendId: number = this.info?.id) {
      await fetch(process.env.VUE_APP_BACKEND_URL + '/users/friendProcess?friendId=' + friendId + '&friendProcessType=' + type, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      if (friendId == this.info?.id)
        setTimeout(this.GetUserData, 50);
      else
        setTimeout(this.ShowFriends, 50);
    },

    async ShowBlockedUsers() {
      const responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users/myBlockedUsers', {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      this.blockedUsers = await responseInfo.json();
      this.blockedUsersVisibility = true;
    },

    async ShowFriends() {
      const responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users/myFriends', {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      this.friends = await responseInfo.json();
      this.friendsVisibility = true;
    },

    async UploadImage(input: any) {
      if (input.srcElement.files.length == 0)
        return;
      const image = input.srcElement.files[0];

      var formData = new FormData();
      formData.append("file", image);
      await axios.post(process.env.VUE_APP_BACKEND_URL + '/users/uploadImage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer ' + cookies.get("token")
        }
      })
      setTimeout(this.GetUserData, 50);
    },

    async UploadImagePanel() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = "image/png, image/jpeg"
      input.click();
      input.onchange = this.UploadImage;
    },

    async Search() {
      if (this.searchBarValue == "")
        return;

      const responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users/search' + '?name=' + this.searchBarValue, {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      this.searchResults = await responseInfo.json();
      this.searchResultsVisibility = true;
    },

    async GetUserData() {
      const states = ["offline", "online", "in game"];
      const statesColors = ["black", "green", "red"];

      var responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users' + (this.me ? "/me" : '/user?id=' + this.otherUserId), {
        headers: { 'Authorization': 'Bearer ' + cookies.get("token") }
      });
      if (!responseInfo.ok) {
        this.$router.push({ path: '/ProfileNotFound' });
        return
      }
      const tmpInfo = await responseInfo.json();
      if (tmpInfo.blockedYou) {
        this.$router.push({ path: '/ProfileNotFound' });
        return;
      }
      this.info = tmpInfo;
      if (!this.me && this.info.me) {
        await this.$router.push({ path: '/profile/me' });
        this.GetUserData();
        return;
      }
      const rankLevel = Math.min(14, Math.floor(Math.max(0, this.info.winCount - this.info.lossCount) / 2));
      this.info.rankImage = this.ranks[rankLevel];
      this.info.userState = states[this.info.state];
      this.info.userStateColor = statesColors[this.info.state];
    },

    async SaveUserDataWithId(userId: number) {
      var responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users' + '/user?id=' + userId, {
        headers: {
          'Authorization': 'Bearer ' + cookies.get("token")
        }
      });
      const info = await responseInfo.json();
      this.tmpUsers.set(userId, info.blockedYou ? null : info);
    },

    OpenProfile(userId: number) {
      this.$router.push({ params: { userId: userId } });
    },
  },
});
</script>
