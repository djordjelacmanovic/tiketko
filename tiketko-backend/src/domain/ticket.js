import { User } from "./user";

export class Ticket {
  static get Status() {
    return {
      Created: "CREATED",
      InProgress: "IN_PROGRESS",
      Closed: "CLOSED",
    };
  }

  constructor(id, user, title, details, status, createdAt) {
    this.id = id;
    this.user = user;
    this.title = title;
    this.details = details;
    this.status = status || Ticket.Status.Created;
    this.createdAt = createdAt || new Date();
  }

  addMessages(...messages) {
    this.messages.push(...messages);
  }

  static fromDto(dto) {
    return new Ticket(
      dto.id,
      User.fromDto(dto.user),
      dto.title,
      dto.details,
      dto.ticket_status,
      new Date(Date.parse(dto.created_at))
    );
  }

  toDto() {
    return {
      id: this.id,
      user_id: this.user.id,
      user: this.user.toDto(),
      ticket_status: this.status,
      title: this.title,
      details: this.details,
      created_at: this.createdAt.toISOString(),
    };
  }
}
