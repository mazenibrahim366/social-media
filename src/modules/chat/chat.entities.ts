import { IChat } from "../../DB/models/models.dto";

export interface  IGetChatResponse {
  chat:Partial<IChat> | null
}