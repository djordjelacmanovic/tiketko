import { User } from "./user";

export class Message {
  constructor(ticketId, user, text, timestamp) {
    this.ticketId = ticketId;
    this.user = user;
    this.text = text;
    this.timestamp = timestamp || new Date();
  }

  toDto() {
    return {
      ticket_id: this.ticketId,
      user: this.user,
      text: this.text,
      timestamp: this.timestamp.toISOString(),
    };
  }

  static fromDto(dto) {
    return new Message(
      dto.ticket_id,
      User.fromDto(dto.user),
      dto.text,
      new Date(Date.parse(dto.timestamp))
    );
  }
}
