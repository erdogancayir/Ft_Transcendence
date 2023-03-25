import { useCookies } from "vue3-cookies";
const { cookies } = useCookies();

export async function GetUserInfo(userId: number) {
    const responseInfo = await fetch(process.env.VUE_APP_BACKEND_URL + '/users' + '/user?id=' + userId, {
        headers: {
            'Authorization': 'Bearer ' + cookies.get("token")
        }
    });
    if (responseInfo.headers.get("content-length") == "0")
        return null;
    return await responseInfo.json();
}