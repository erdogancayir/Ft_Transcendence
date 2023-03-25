import jwt_decode, { JwtPayload } from "jwt-decode";
import { useCookies } from "vue3-cookies";

export class JwtControllerService {
    isActive(getToken: string): boolean {
        const expirationDate = this.getTokenExpirationDate(getToken);
        return expirationDate !== null && expirationDate.valueOf() > new Date().valueOf();
    }

    isTokenValid(token: string): boolean {
        if (useCookies().cookies.get('token'))
            return this.isActive(token);
        return (false);
    }

    decodeToken(getToken: string) {
        return jwt_decode(getToken);
    }

    getTokenExpirationDate(getToken: string) {
        const decoded:JwtPayload = jwt_decode(getToken);
        if (!decoded.exp) {
          return null;
        }
      
        const date = new Date(0);
        date.setUTCSeconds(decoded.exp);
        return date;
    }
}