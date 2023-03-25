import { PrismaService } from 'src/prisma/prisma.service';
import { Global } from '@nestjs/common';

export enum State {
    offline,
    online,
    inGame
}

@Global()
export class UserStates {
    constructor(private prisma: PrismaService) {
    }
    public activeUsers = new Map<string, number>();
    public inGameUsers = new Map<string, number>();


    public async DidOtherBanMe(myId: number, otherId: number) {
        const other: any = await this.prisma.user.findUnique({
            where: { id: otherId, },
        });
        return other.blockedUsersId.includes(myId);
    }

    public async DidIBanOther(myId: number, otherId: number) {
        const my: any = await this.prisma.user.findUnique({
            where: { id: myId, },
        });
        return my.blockedUsersId.includes(otherId);
    }

    public isInGame(id: number): boolean {
        for (let [key, value] of this.inGameUsers.entries())
            if (value == id)
                return true;
        return false;
    }

    public isActive(id: number) {
        for (let [key, value] of this.activeUsers.entries())
            if (value == id)
                return true;
        return false;
    }

    public GetState(id: number) {
        if (this.isInGame(id))
            return State.inGame;
        if (this.isActive(id))
            return State.online;
        return State.offline;
    }

    public GetSocketsIdWithUserId(id: number): any[] {
        var result = new Array();
        for (let [key, value] of this.activeUsers.entries())
            if (value == id)
                result.push(key);
        return result;
    }
}