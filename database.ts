import { DataSource } from "typeorm"
import { User } from "./models/User"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5434,
    username: "admin",
    password: "root",
    database: "telegramDB",
    entities: [User],
    synchronize: true
})

