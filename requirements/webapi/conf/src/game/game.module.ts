import { Module } from "@nestjs/common";
import { UserStates } from "src/user/user.states";
import { GameService } from "./game.service";

@Module({
    providers: [GameService,UserStates],
})
export class GameModule { }