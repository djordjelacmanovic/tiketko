export class User {
  constructor(id, username, email, group = "user") {
    this.id = id;
    this.username = username;
    this.email = email;
    this.group = group;
  }

  static fromDto(dto) {
    return new User(dto.id, dto.username, dto.email, dto.group);
  }

  toDto() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      group: this.group,
    };
  }
}
